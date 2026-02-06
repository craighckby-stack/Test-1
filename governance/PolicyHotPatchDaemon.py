import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional, TypedDict

# NOTE: Defines structured contracts for governance data.
class ProposalPayload(TypedDict):
    """Defines the structure of the policy content to be hashed (Input)."""
    ACVD: Dict[str, Any]
    FASV: Dict[str, Any]

class PolicyProposalState(TypedDict):
    """The complete immutable proposal, including metadata used for hashing."""
    version: str
    ACVD: Dict[str, Any]
    FASV: Dict[str, Any]

class StagingArtifact(TypedDict):
    CSR_HASH_N_PLUS_1: str
    POLICY_PAYLOAD: PolicyProposalState
    QUORUM_ATTESTATION: Dict[str, str]
    STATUS: str
    HASH_ALGORITHM: str

class SignatureVerifier:
    """Interface dependency for strong cryptographic verification."""
    def verify(self, payload_hash: str, authority_id: str, signature: str) -> bool:
        # Placeholder for actual cryptographic key lookup and verification logic
        # In production, this uses external HSM or trusted public key lists.
        return len(signature) > 10 

class PolicyHotPatchDaemon:
    """
    PHPD (Policy Hot-Patch Daemon) - V2.0
    Role: Secure, off-cycle staging and ratification of the next Config State Root (CSR_N+1).
    Utilizes stronger hashing and mandatory external signature verification.
    """

    # Upgrading standard hashing algorithm for future resilience
    HASH_ALGORITHM = 'sha3_512'

    def __init__(self, required_quorum_signatures: int, verifier: SignatureVerifier):
        self.quorum_count: int = required_quorum_signatures
        self.signatures: Dict[str, str] = {}
        self._proposal_state: Optional[PolicyProposalState] = None
        self._proposed_csr_hash: Optional[str] = None
        self.verifier = verifier

    @staticmethod
    def _generate_csr_hash(policy_proposal_state: PolicyProposalState, algorithm: str) -> str:
        """Calculates the deterministic hash of the proposed state root based on standardized JSON representation."""
        # Use separators=(',', ':') to eliminate unnecessary whitespace and ensure consistent representation.
        proposal_string = json.dumps(policy_proposal_state, sort_keys=True, separators=(',', ':'))
        
        if algorithm not in hashlib.algorithms_available:
            raise ValueError(f"Algorithm {algorithm} not available on this system.")
            
        hasher = hashlib.new(algorithm)
        hasher.update(proposal_string.encode('utf-8'))
        return hasher.hexdigest()

    def load_proposal(self, proposal_data: ProposalPayload) -> str:
        """Loads the Tier 1 artifacts, generates versioning metadata, and computes the CSR hash."""
        
        new_proposal_state: PolicyProposalState = {
            # Explicitly mark version as derived upon PHPD load/processing time
            "version": datetime.utcnow().isoformat() + "_PHPD_LOAD", 
            "ACVD": proposal_data["ACVD"],
            "FASV": proposal_data["FASV"]
        }
        
        # Calculate the future CSR hash (CSR_N+1)
        self._proposed_csr_hash = self._generate_csr_hash(new_proposal_state, self.HASH_ALGORITHM)
        self._proposal_state = new_proposal_state
        self.signatures = {} # Crucially, reset signatures upon loading a new proposal
        
        return self._proposed_csr_hash

    def ratify(self, authority_id: str, signature: str) -> bool:
        """Adds cryptographic ratification, requiring signature verification against the proposed CSR hash."""
        if not self._proposed_csr_hash:
            raise RuntimeError("Proposal must be loaded before ratification.")

        if authority_id in self.signatures:
            return False 

        # INTEGRITY CHECK: Use the injected verifier for security best practices
        if not self.verifier.verify(self._proposed_csr_hash, authority_id, signature):
            return False 

        self.signatures[authority_id] = signature
        return True

    def finalize_and_stage(self) -> Optional[StagingArtifact]:
        """Finalizes the new CSR proposal if quorum is met, producing the definitive staging artifact."""
        if len(self.signatures) >= self.quorum_count and self._proposed_csr_hash and self._proposal_state:
            staging_artifact: StagingArtifact = {
                "CSR_HASH_N_PLUS_1": self._proposed_csr_hash,
                "POLICY_PAYLOAD": self._proposal_state,
                "QUORUM_ATTESTATION": self.signatures,
                "STATUS": "READY_FOR_S00_ANCHORING",
                "HASH_ALGORITHM": self.HASH_ALGORITHM
            }
            # In production, this artifact is passed to the CRoTPersistenceLayer (see scaffold)
            return staging_artifact
        else:
            return None