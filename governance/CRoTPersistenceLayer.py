# governance/CRoTPersistenceLayer.py
import logging
import hashlib
import json
from typing import Optional, Dict, Any, TypeAlias

# --- Architectural Dependency Imports (Refactored) ---
# Standardizing imports from the centralized interface layer.
# The local definitions are replaced by imports from governance.interfaces.core.
from governance.interfaces.core import (
    PolicyProposalState, 
    StagingArtifact, 
    SecureVaultInterface
)

logger = logging.getLogger(__name__)

class IntegrityError(Exception):
    """Raised when artifact integrity verification fails."""
    pass

class CRoTPersistenceLayer:
    """
    CRoT (Configuration Root of Trust) Persistence Layer - V3.0
    Role: Handles authenticated, integrity-checked storage and retrieval of finalized
    Policy Hot-Patch artifacts, providing the secure anchor for policy evolution.
    Strictly adheres to DIP using SecureVaultInterface.
    """
    
    # Constants for Persistence
    ARTIFACT_ID_PREFIX = "csr_stage_"
    ARTIFACT_ID_SUFFIX = ".json"
    DEFAULT_HASH_ALGORITHM = 'SHA256'

    def __init__(self, secure_vault: SecureVaultInterface, vault_id: str):
        """
        :param secure_vault: Implementation of the SecureVaultInterface.
        :param vault_id: Identifier for the specific high-security storage path.
        """
        if not vault_id or not isinstance(vault_id, str):
            raise ValueError("Vault ID must be a non-empty string.")

        self._vault = secure_vault
        self._vault_id = vault_id
        # Removed internal logging.basicConfig call, configuration handled by application root.

        logger.info(f"CRoT Layer initialized for Vault ID: {vault_id}")

    @staticmethod
    def _get_artifact_key(csr_hash: str) -> str:
        """Generates the canonical artifact key for vault storage."""
        return f"{CRoTPersistenceLayer.ARTIFACT_ID_PREFIX}{csr_hash.upper()}{CRoTPersistenceLayer.ARTIFACT_ID_SUFFIX}"

    @staticmethod
    def calculate_payload_hash(payload: PolicyProposalState, algorithm: str = DEFAULT_HASH_ALGORITHM) -> str:
        """
        Calculates the canonical hash of the policy payload (ensures deterministic JSON serialization).
        This utility is now exposed statically as it's a pure function.
        """
        # Ensure deterministic JSON: sorted keys, no whitespace separators
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        
        algorithm_norm = algorithm.lower()
        
        try:
            # Use `hashlib.new` for dynamic algorithm selection
            hasher = hashlib.new(algorithm_norm)
            hasher.update(payload_str)
            return hasher.hexdigest().upper()
        except ValueError as e:
            # Handle unrecognized algorithms robustly
            raise IntegrityError(f"Unsupported hash algorithm '{algorithm}' specified: {e}")

    def anchor_staging_artifact(self, artifact: StagingArtifact) -> bool:
        """
        Anchors the finalized artifact (CSR_N+1) after quorum ratification.
        This operation includes critical integrity re-verification (Defense in Depth).
        """
        expected_hash = artifact['CSR_HASH_N_PLUS_1'].upper()
        algorithm = artifact.get('HASH_ALGORITHM', self.DEFAULT_HASH_ALGORITHM)
        
        # 1. Critical Re-verification
        try:
            calculated_hash = self.calculate_payload_hash(artifact['POLICY_PAYLOAD'], algorithm)
        except IntegrityError as e:
            logger.error(f"Policy hash calculation failed during anchoring: {e}")
            return False

        if calculated_hash != expected_hash:
            # Raise explicit error and use critical logging for integrity breaches
            logger.critical(
                "INTEGRITY FAILURE: Hash mismatch during anchoring. "
                f"Expected: {expected_hash}, Calculated: {calculated_hash}"
            )
            raise IntegrityError("Artifact content integrity verification failed.")
            
        # 2. Anchoring to Vault
        try:
            artifact_key = self._get_artifact_key(expected_hash)
            artifact_data = json.dumps(artifact)
            
            success = self._vault.put(
                self._vault_id,
                artifact_key,
                artifact_data
            )
            
            if success:
                logger.info(f"Anchor SUCCESS: Stored artifact {artifact_key}")
            else:
                logger.error(f"Failed to execute vault put operation for {artifact_key}")

            return success
            
        except Exception:
            # Use logger.exception for full stack traces on unexpected vault failures
            logger.exception(f"FATAL ERROR during vault anchoring to {self._vault_id}.")
            return False

    def retrieve_active_csr_hash(self) -> Optional[str]:
        """Retrieves the hash of the currently ACTIVE Configuration State Root (CSR_N)."""
        try:
            active_hash = self._vault.get_current_pointer(self._vault_id)
            if active_hash:
                return active_hash.upper() # Ensure hash is consistently uppercase
            return None
        except Exception:
            logger.exception(f"Operational error retrieving active CSR pointer from vault {self._vault_id}.")
            return None

    def retrieve_artifact_by_hash(self, csr_hash: str) -> Optional[StagingArtifact]:
        """Retrieves a specific stored governance artifact by its hash and parses it."""
        artifact_key = self._get_artifact_key(csr_hash)
        
        try:
            raw_data = self._vault.get(self._vault_id, artifact_key)
            if raw_data:
                return json.loads(raw_data)
            
            logger.debug(f"Artifact not found for key: {artifact_key}")
            return None

        except json.JSONDecodeError:
            logger.warning(f"Vault returned malformed JSON data for key: {artifact_key}")
            return None
        except Exception:
            logger.exception(f"Operational error retrieving artifact {artifact_key}.")
            return None