# governance/CRoTPersistenceLayer.py
import logging
import hashlib
import json
from typing import Optional, Dict, Any, TypeAlias, Type, Callable

# --- Architectural Dependency Imports ---
# Standardizing imports from the centralized interface layer.
from governance.interfaces.core import (
    PolicyProposalState, 
    StagingArtifact, 
    SecureVaultInterface
)

logger = logging.getLogger(__name__)

class IntegrityError(Exception):
    """Raised when artifact integrity verification fails."""
    pass

class OperationalError(Exception):
    """Raised for errors during vault communication or storage operations."""
    pass

# Helper TypeAlias for clarity
CSRHash: TypeAlias = str 

class CRoTPersistenceLayer:
    """
    CRoT (Configuration Root of Trust) Persistence Layer - V4.0 (Enhanced Activation)
    Role: Handles authenticated, integrity-checked storage and atomic activation 
    of finalized Policy Hot-Patch artifacts, providing the secure anchor for policy evolution.
    
    Adopts DIP using SecureVaultInterface, requiring `exists` and `set_pointer` methods
    on the vault interface for robust, atomic CSR activation.
    """
    
    # Constants for Persistence
    ARTIFACT_ID_PREFIX = "csr_stage_"
    ARTIFACT_ID_SUFFIX = ".json"
    DEFAULT_HASH_ALGORITHM = 'SHA256'
    
    # Identifier for the pointer that marks the current ACTIVE CSR
    ACTIVE_CSR_POINTER_KEY = "CURRENT_CSR_HASH" 

    def __init__(self, secure_vault: SecureVaultInterface, vault_context: str):
        """
        :param secure_vault: Implementation of the SecureVaultInterface.
        :param vault_context: Identifier for the specific high-security storage path/context.
        """
        if not vault_context or not isinstance(vault_context, str):
            raise ValueError("Vault Context identifier must be a non-empty string.")

        self._vault = secure_vault
        self._context = vault_context
        
        logger.info(f"CRoT Layer initialized for Context: {self._context}")

    # --- Utility Methods ---

    @classmethod
    def _get_artifact_key(cls, csr_hash: CSRHash) -> str:
        """Generates the canonical artifact key for vault storage."""
        return f"{cls.ARTIFACT_ID_PREFIX}{csr_hash.upper()}{cls.ARTIFACT_ID_SUFFIX}"

    @classmethod
    def calculate_payload_hash(cls, payload: PolicyProposalState, algorithm: str = DEFAULT_HASH_ALGORITHM) -> CSRHash:
        """
        Calculates the canonical hash of the policy payload (ensures deterministic JSON serialization).
        """
        # Ensure deterministic JSON: sorted keys, no whitespace separators
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        
        algorithm_norm = algorithm.lower()
        
        try:
            hasher = hashlib.new(algorithm_norm)
            hasher.update(payload_str)
            return hasher.hexdigest().upper()
        except ValueError as e:
            raise IntegrityError(f"Unsupported hash algorithm '{algorithm}' specified: {e}")

    # --- Persistence Operations ---

    def anchor_staging_artifact(self, artifact: StagingArtifact) -> bool:
        """
        Anchors the finalized artifact (CSR_N+1) into immutable storage after integrity verification.
        """
        try:
            expected_hash = artifact['CSR_HASH_N_PLUS_1'].upper()
            policy_payload = artifact['POLICY_PAYLOAD']
            algorithm = artifact.get('HASH_ALGORITHM', self.DEFAULT_HASH_ALGORITHM)
            
            # 1. Critical Integrity Check
            calculated_hash = self.calculate_payload_hash(policy_payload, algorithm)

            if calculated_hash != expected_hash:
                logger.critical(
                    "INTEGRITY FAILURE: Hash mismatch during anchoring. "
                    f"Expected: {expected_hash}, Calculated: {calculated_hash}"
                )
                raise IntegrityError("Artifact content integrity verification failed.")
                
            # 2. Anchoring to Vault
            artifact_key = self._get_artifact_key(expected_hash)
            artifact_data = json.dumps(artifact)
            
            success = self._vault.put(self._context, artifact_key, artifact_data)
            
            if success:
                logger.info(f"Anchor SUCCESS: Stored artifact {artifact_key}")
            else:
                raise OperationalError(f"Vault put operation failed for {artifact_key}.")

            return True
            
        except IntegrityError:
            # Allow IntegrityErrors to propagate cleanly
            raise
        except KeyError as e:
            logger.error(f"Malformed StagingArtifact missing required key: {e}")
            return False
        except OperationalError:
            return False
        except Exception:
            logger.exception(f"FATAL UNHANDLED ERROR during vault anchoring to {self._context}.")
            return False

    def activate_artifact(self, csr_hash: CSRHash) -> bool:
        """
        Atomically updates the CSR root pointer to reference the newly anchored artifact.
        Requires the vault interface to support `set_pointer`.
        """
        validated_hash = csr_hash.upper()
        
        if not self.check_artifact_exists(validated_hash):
            logger.warning(f"Activation failure: Cannot activate non-existent artifact {validated_hash}.")
            return False
            
        try:
            # The CRoT uses set_pointer for atomic root activation
            success = self._vault.set_pointer(
                context=self._context,
                key_name=self.ACTIVE_CSR_POINTER_KEY,
                pointer_value=validated_hash
            )

            if success:
                logger.info(f"Activation SUCCESS: CSR Root Pointer updated to {validated_hash}.")
                return True
            else:
                raise OperationalError("Failed to update active CSR pointer in vault.")
                
        except Exception:
            logger.exception(f"Operational error during activation of {validated_hash} in {self._context}.")
            return False

    def retrieve_active_csr_hash(self) -> Optional[CSRHash]:
        """Retrieves the hash of the currently ACTIVE Configuration State Root (CSR_N)."""
        try:
            # We standardize retrieval of the pointer using a dedicated configuration accessor if available,
            # or rely on the potentially existing generic `get_current_pointer`.
            if hasattr(self._vault, 'get_config_value'):
                active_hash = self._vault.get_config_value(self._context, self.ACTIVE_CSR_POINTER_KEY)
            else:
                 active_hash = self._vault.get_current_pointer(self._context)

            if active_hash:
                return active_hash.upper()
            return None
        except Exception:
            logger.exception(f"Operational error retrieving active CSR pointer from vault {self._context}.")
            return None

    def check_artifact_exists(self, csr_hash: CSRHash) -> bool:
        """Utility to quickly check if a specific artifact key exists, required for pre-activation validation."""
        artifact_key = self._get_artifact_key(csr_hash)
        try:
            return self._vault.exists(self._context, artifact_key)
        except Exception:
            logger.exception(f"Error checking existence for {artifact_key}.")
            return False

    def retrieve_artifact_by_hash(self, csr_hash: CSRHash) -> Optional[StagingArtifact]:
        """Retrieves a specific stored governance artifact by its hash and parses it."""
        artifact_key = self._get_artifact_key(csr_hash)
        
        try:
            raw_data = self._vault.get(self._context, artifact_key)
            if raw_data:
                try:
                    return json.loads(raw_data)
                except json.JSONDecodeError:
                    logger.warning(f"Vault returned malformed JSON data for key: {artifact_key}")
                    return None
            
            logger.debug(f"Artifact not found for key: {artifact_key}")
            return None

        except Exception:
            logger.exception(f"Operational error retrieving artifact {artifact_key}.")
            return None