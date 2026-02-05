class PayloadManifestHashLock:
    """PMH: Manages cryptographic integrity lock across GSEP Stages 3 and 4.
    Ensures M-02 reviewed by P-01 is identical to M-02 tested by PSR.
    """

    def __init__(self, hash_algorithm='SHA256'):
        self.algorithm = hash_algorithm
        self._manifest_hash = None

    def create_lock(self, mutation_payload: dict) -> str:
        """Creates an immutable hash lock for the M-02 payload post-Stage 3 simulation.
        Data must be canonicalized before hashing.
        """
        canonical_data = self._canonicalize(mutation_payload)
        self._manifest_hash = self._calculate_hash(canonical_data)
        print(f"PMH Lock Created: {self._manifest_hash}")
        return self._manifest_hash

    def verify_lock(self, mutation_payload: dict) -> bool:
        """Verifies the current M-02 payload against the stored hash lock (Stage 4 check)."""
        if not self._manifest_hash:
            raise RuntimeError("PMH lock not yet established (Stage 3 failure).")
            
        canonical_data = self._canonicalize(mutation_payload)
        current_hash = self._calculate_hash(canonical_data)

        if current_hash != self._manifest_hash:
            raise IntegrityError("M-02 Payload Tampering Detected (Hash Mismatch).")
        
        return True

    def _canonicalize(self, data: dict) -> str:
        # Ensure reproducible serialization (sorted keys)
        import json
        return json.dumps(data, sort_keys=True, indent=None)

    def _calculate_hash(self, data_string: str) -> str:
        import hashlib
        h = hashlib.new(self.algorithm)
        h.update(data_string.encode('utf-8'))
        return h.hexdigest()

class IntegrityError(Exception):
    pass

# Interface usage:
# pmh = PayloadManifestHashLock()
# pmh.create_lock(M_02_data_staged_3)
# ... data transfer ...
# pmh.verify_lock(M_02_data_staged_4) # If True, proceeds to P-01 calculus.