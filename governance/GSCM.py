class GSEPStateChainManager:
    """
    GSEP State Chain Manager (GSCM)
    Purpose: Manages cryptographic state transition integrity for the Governance Evolution Protocol (GSEP L0-L6).
    This module is the sole issuer and verifier of the output locks (L_N) required for sequential GSEP progression.
    It decouples cryptographic hashing and verification from the GCO's core orchestration logic.
    """
    import hashlib
    import time
    from typing import Dict, Any

    def __init__(self, key_material: str):
        # Use a deterministic hash of the key material for internal reference
        self._root_key_hash = hashlib.sha256(key_material.encode()).hexdigest()
        self.ledger: Dict[str, Dict[str, Any]] = {}

    def _generate_artifact_hash(self, artifact_content: Dict[str, Any]) -> str:
        """Generates a verifiable hash based on canonicalized artifact content (ASDM compliant)."""
        # Sorting items ensures deterministic string representation regardless of input order
        content_string = str(sorted(artifact_content.items()))
        return hashlib.sha512(content_string.encode()).hexdigest()

    def issue_stage_lock(self, stage_id: str, preceding_lock: str, artifact: Dict[str, Any]) -> str:
        """
        Issues the cryptographic lock (L_N) for the current GSEP stage.
        Raises PermissionError if the preceding lock (L_N-1) is invalid for sequential chaining.
        """
        # L0 is a special initialization stage
        if stage_id != 'L0' and preceding_lock not in [v.get('lock') for v in self.ledger.values()]:
            raise PermissionError(f"GSCM: Invalid preceding lock found for {stage_id}. Sequence halted.")

        artifact_hash = self._generate_artifact_hash(artifact)
        
        # Combine sequencing data, artifact integrity, and root governance key for the new lock
        lock_data = f"{self._root_key_hash}:{stage_id}:{artifact_hash}:{preceding_lock}:{time.time()}"
        new_lock = hashlib.sha256(lock_data.encode()).hexdigest()

        self.ledger[stage_id] = {
            "timestamp": time.time(),
            "preceding_lock": preceding_lock,
            "artifact_hash": artifact_hash,
            "lock": new_lock,
            "status": "COMMITTED"
        }
        return new_lock

    def verify_chain_integrity(self, stage_id: str, expected_lock: str) -> bool:
        """Verifies if the stored lock for a given stage matches the expected cryptographic output."""
        if stage_id not in self.ledger:
            return False
        return self.ledger[stage_id]['lock'] == expected_lock
