import logging
from typing import Dict, Any, Protocol, Optional

# --- Assume External Dependencies (Contextual Imports) ---
# These placeholders define expected structure from related modules.

class StagingArtifact(Dict[str, Any]):
    """Type alias for the structured policy artifact being committed."""
    pass

class ConfigStateHasher:
    @staticmethod
    def calculate(payload: Any, algorithm: str) -> str:
        """Static method to compute the hash of the policy payload."""
        raise NotImplementedError("Placeholder for external hashing utility.")
# ---------------------------------------------------------


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

# Define Core Interfaces (Architectural Dependency Injection requirement)
class IPersistenceAdapter(Protocol):
    """Protocol defining the required methods for the CSR Persistence Client.
    This allows for clean Dependency Inversion/Injection."""
    def write_artifact(self, artifact: StagingArtifact) -> None:
        """Writes the artifact to the underlying immutable store. Must be atomic/transactional.
        Raises: Exception on persistence failure."""
        ...
    def get_latest_hash(self) -> str:
        """Retrieves the absolute latest committed CSR hash from storage."""
        ...

class CommitmentError(Exception):
    """Custom exception raised specifically during PolicyAnchor commit failures."""
    pass

class PolicyAnchor:
    """
    The Policy Anchor acts as the secure persistence and retrieval layer for Config State Roots (CSRs).
    It manages the volatile state pointer based on ratified and securely persisted policy artifacts.
    """

    def __init__(self, persistence_client: IPersistenceAdapter, initial_csr_hash: str):
        if not isinstance(initial_csr_hash, str) or not initial_csr_hash:
            raise ValueError("initial_csr_hash must be a non-empty string.")
            
        self._client: IPersistenceAdapter = persistence_client
        self._active_csr_hash = initial_csr_hash
        logger.info(f"PolicyAnchor initialized with active CSR: {self._active_csr_hash[:16]}...")

    def get_active_csr_hash(self) -> str:
        """Retrieves the currently active and ratified Config State Root hash."""
        return self._active_csr_hash

    def commit_new_csr(self, staging_artifact: StagingArtifact) -> None:
        """
        Atomically commits the new staging artifact to the persistent store.
        Validates the hash before committing and updates the active CSR pointer.
        
        Raises: CommitmentError if hash mismatch or persistence fails.
        """
        
        new_hash = staging_artifact.get('CSR_HASH_N_PLUS_1')
        policy_payload = staging_artifact.get('POLICY_PAYLOAD')
        hash_algorithm = staging_artifact.get('HASH_ALGORITHM', 'SHA256')

        if not new_hash:
             raise CommitmentError("Staging artifact missing 'CSR_HASH_N_PLUS_1'.")

        # 1. Integrity Check (Crucial)
        try:
            computed_hash = ConfigStateHasher.calculate(policy_payload, hash_algorithm)
        except Exception as e:
            raise CommitmentError(f"Hashing mechanism failed during CSR calculation: {e}")

        if computed_hash != new_hash:
            raise CommitmentError(
                f"Hash integrity failed. Computed Hash: {computed_hash} Expected: {new_hash}"
            )
        
        logger.debug(f"CSR hash integrity verified for new artifact.")

        # 2. Persistence Layer Write
        try:
            self._client.write_artifact(staging_artifact)
            
            # 3. Update volatile state (only if persistence succeeds)
            self._active_csr_hash = new_hash
            logger.info(f"Policy ratified. New active CSR: {new_hash[:16]}...")
            
        except Exception as e:
            logger.error(f"Critical persistence failure during CSR commit: {e}", exc_info=True)
            raise CommitmentError(f"Persistence failure during commit: {e}")