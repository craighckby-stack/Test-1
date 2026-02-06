import logging
import hashlib
import json
from datetime import datetime
from typing import Optional, Dict, Any

# --- Architectural Dependency Imports (Scaffolded) ---
# These types and interfaces are now centralized for dependency injection (DIP).
# from governance.interfaces.core import PolicyProposalState, StagingArtifact, SecureVaultInterface

# Temporarily redefine Protocol/TypedDict dependencies locally until scaffold import paths are finalized
from typing import TypedDict, Protocol

class PolicyProposalState(TypedDict):
    version: str
    ACVD: Dict[str, Any]
    FASV: Dict[str, Any]

class StagingArtifact(TypedDict):
    CSR_HASH_N_PLUS_1: str
    POLICY_PAYLOAD: PolicyProposalState
    QUORUM_ATTESTATION: Dict[str, str]
    STATUS: str
    HASH_ALGORITHM: str

class SecureVaultInterface(Protocol):
    """Protocol defining the secure storage API for Dependency Inversion."""
    def put(self, vault_id: str, key: str, data: str) -> bool: ...
    def get(self, vault_id: str, key: str) -> Optional[str]: ...
    def get_current_pointer(self, vault_id: str) -> Optional[str]: ...

# --------------------------------------------------

logger = logging.getLogger(__name__)

class IntegrityError(Exception):
    """Raised when artifact integrity verification fails."""
    pass

class CRoTPersistenceLayer:
    """
    CRoT (Configuration Root of Trust) Persistence Layer - V2.0
    Role: Handles authenticated, integrity-checked storage and retrieval of finalized
    Policy Hot-Patch artifacts, providing the secure anchor for policy evolution.
    Uses Dependency Injection for vault storage mechanisms (DIP adherence).
    """

    def __init__(self, secure_vault: SecureVaultInterface, vault_id: str):
        """
        :param secure_vault: Implementation of the SecureVaultInterface.
        :param vault_id: Identifier for the specific high-security storage path.
        """
        self._vault = secure_vault
        self._vault_id = vault_id
        logging.basicConfig(level=logging.INFO) # Ensure logger is configured
        logger.info(f"CRoT Layer initialized for Vault ID: {vault_id}")

    @staticmethod
    def _calculate_payload_hash(payload: PolicyProposalState, algorithm: str) -> str:
        """Calculates the canonical hash of the policy payload (ensures deterministic JSON serialization)."""
        # Sort keys and minimize separators for guaranteed canonical JSON form
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        
        try:
            hasher = hashlib.new(algorithm.lower())
            hasher.update(payload_str)
            return hasher.hexdigest().upper()
        except ValueError as e:
            raise IntegrityError(f"Unsupported hash algorithm '{algorithm}' specified: {e}")

    def anchor_staging_artifact(self, artifact: StagingArtifact) -> bool:
        """
        Anchors the finalized artifact (CSR_N+1) after quorum ratification.
        This operation includes critical integrity re-verification.
        """
        expected_hash = artifact['CSR_HASH_N_PLUS_1'].upper()
        # Defaulting to SHA256 if HASH_ALGORITHM is missing is acceptable behavior for secure systems.
        algorithm = artifact.get('HASH_ALGORITHM', 'SHA256')
        
        # 1. Critical Re-verification (Defense in Depth)
        try:
            calculated_hash = self._calculate_payload_hash(artifact['POLICY_PAYLOAD'], algorithm)
        except IntegrityError as e:
            logger.error(f"Integrity check failed during anchoring: {e}")
            return False

        if calculated_hash != expected_hash:
            logger.critical(
                f"INTEGRITY FAILURE: Calculated hash mismatch during anchoring. "
                f"Expected: {expected_hash}, Calculated: {calculated_hash}"
            )
            raise IntegrityError("Artifact content integrity verification failed.")
            
        # 2. Anchoring to Vault
        try:
            artifact_id = f"csr_stage_{expected_hash}.json"
            
            success = self._vault.put(
                self._vault_id,
                artifact_id,
                json.dumps(artifact)
            )
            
            if success:
                logger.info(f"SUCCESS: Securely anchored {artifact_id}")
            else:
                logger.error(f"Failed to execute put operation for {artifact_id} in vault {self._vault_id}")

            return success
            
        except Exception as e:
            logger.error(f"FATAL ERROR during anchoring to {self._vault_id}: {type(e).__name__}: {e}")
            return False

    def retrieve_active_csr_hash(self) -> Optional[str]:
        """Retrieves the hash of the currently ACTIVE Configuration State Root (CSR_N)."""
        try:
            # Assumes the vault interface manages the 'active' pointer.
            return self._vault.get_current_pointer(self._vault_id)
        except Exception as e:
            logger.error(f"Error retrieving active CSR pointer from vault {self._vault_id}: {e}")
            return None

    def retrieve_artifact_by_hash(self, csr_hash: str) -> Optional[StagingArtifact]:
        """Retrieves a specific stored governance artifact by its hash and parses it."""
        artifact_id = f"csr_stage_{csr_hash.upper()}.json"
        
        try:
            raw_data = self._vault.get(self._vault_id, artifact_id)
            if raw_data:
                return json.loads(raw_data) # Returns StagingArtifact TypedDict
            return None
        except json.JSONDecodeError:
            logger.warning(f"Vault returned invalid JSON data for hash: {csr_hash}")
            return None
        except Exception as e:
            logger.error(f"Error retrieving artifact {artifact_id}: {e}")
            return None