import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, TypedDict

# --- [ Data Contracts / Structures ] ---

class ProposalPayload(TypedDict):
    """Defines the structure of the policy content supplied by the caller (Input)."""
    ACVD: Dict[str, Any]
    FASV: Dict[str, Any]

class ImmutablePolicySource(TypedDict):
    """The complete immutable data set that is hashed to form the CSR_N+1."""
    version_id: str  # Generated timestamp + unique ID prefix
    ACVD: Dict[str, Any]
    FASV: Dict[str, Any]

class StagingArtifact(TypedDict):
    """The final, signed result ready for persistence and anchoring."""
    CSR_HASH_N_PLUS_1: str
    POLICY_PAYLOAD: ImmutablePolicySource
    QUORUM_ATTESTATION: Dict[str, str]
    STATUS: str
    HASH_ALGORITHM: str

# --- [ Dependencies / Interfaces ] ---

class SignatureVerifier:
    """Interface for strong cryptographic verification of attestations."""
    def verify(self, payload_hash: str, authority_id: str, signature: str) -> bool:
        # Placeholder for actual verification logic
        # In production, this uses external HSM or trusted public key lists.
        return len(signature) > 10 and authority_id is not None 

# --- [ Core Hashing Logic Utility ] ---

class ConfigStateHasher:
    """Utility class to ensure deterministic hashing of configuration states."""

    @staticmethod
    def calculate(data_source: ImmutablePolicySource, algorithm: str) -> str:
        """Calculates the deterministic hash based on standardized JSON representation."""
        
        # Security/Efficiency: Ensure deterministic JSON serialization
        # Standard: sort_keys=True, compact separators=(',', ':')
        proposal_string = json.dumps(data_source, sort_keys=True, separators=(',', ':'))
        
        if algorithm not in hashlib.algorithms_available:
            raise ValueError(f"Hashing Algorithm '{algorithm}' not available.")
            
        hasher = hashlib.new(algorithm)
        hasher.update(proposal_string.encode('utf-8'))
        return hasher.hexdigest()

# --- [ Daemon Implementation ] ---

class PolicyHotPatchDaemon:
    """
    PHPD (Policy Hot-Patch Daemon) - V2.1: Refactored State Management.
    Role: Secure, off-cycle staging and ratification of the next Config State Root (CSR_N+1).
    Utilizes dedicated hashing utility and mandatory external signature verification.
    """

    DEFAULT_HASH_ALGORITHM: str = 'sha3_512'

    def __init__(self, required_quorum_signatures: int, verifier: SignatureVerifier):
        self.quorum_count: int = required_quorum_signatures
        self.verifier: SignatureVerifier = verifier
        
        # Encapsulated state (should be reset on every new load_proposal)
        self._current_proposal: Optional[ImmutablePolicySource] = None
        self._current_hash: Optional[str] = None
        self._signatures: Dict[str, str] = {}

    def is_proposal_active(self) -> bool:
        """Checks if a valid proposal is currently loaded and awaiting ratification."""
        return self._current_hash is not None

    def load_proposal(self, proposal_data: ProposalPayload) -> str:
        """Loads the Tier 1 artifacts, generates versioning metadata, and computes the CSR hash."""
        
        # 1. Generate deterministic version ID using explicit UTC (ZULU time)
        version_timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds')
        version_id = f"PHPD_{version_timestamp}_V1" 
        
        new_proposal_state: ImmutablePolicySource = {
            "version_id": version_id, 
            "ACVD": proposal_data["ACVD"],
            "FASV": proposal_data["FASV"]
        }
        
        # 2. Calculate the future CSR hash (CSR_N+1) using the dedicated utility
        proposed_csr_hash = ConfigStateHasher.calculate(
            new_proposal_state, self.DEFAULT_HASH_ALGORITHM
        )
        
        # 3. Update internal state and reset signatures
        self._current_proposal = new_proposal_state
        self._current_hash = proposed_csr_hash
        self._signatures = {} 
        
        return proposed_csr_hash

    def ratify(self, authority_id: str, signature: str) -> bool:
        """Adds cryptographic ratification, requiring signature verification against the proposed CSR hash."""
        
        if not self.is_proposal_active():
            raise RuntimeError("Proposal must be loaded before ratification attempts.")

        if authority_id in self._signatures:
            return False 

        # INTEGRITY CHECK: Use the injected verifier for security best practices
        if not self.verifier.verify(self._current_hash, authority_id, signature):
            return False 

        self._signatures[authority_id] = signature
        return True

    def finalize_and_stage(self) -> Optional[StagingArtifact]:
        """Finalizes the new CSR proposal if quorum is met, producing the definitive staging artifact."""
        
        if not self.is_proposal_active():
            return None
        
        # Check Quorum
        if len(self._signatures) < self.quorum_count:
            return None
            
        # Quorum met, finalize artifact
        staging_artifact: StagingArtifact = {
            "CSR_HASH_N_PLUS_1": self._current_hash,
            "POLICY_PAYLOAD": self._current_proposal,
            "QUORUM_ATTESTATION": self._signatures,
            "STATUS": "READY_FOR_S00_ANCHORING",
            "HASH_ALGORITHM": self.DEFAULT_HASH_ALGORITHM
        }
        
        # Return artifact for persistence layer
        return staging_artifact
