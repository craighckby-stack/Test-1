import hashlib
import json
from typing import Dict, Any, Optional

# Assuming existence of the proposed utility for advanced hashing stability
# If governance/config/hash_exclusion_config does not exist yet, this import will fail, 
# but the accompanying scaffold request addresses this.
from governance.config.hash_exclusion_config import HashExclusionUtility

class IntegrityError(Exception):
    """Custom error raised upon cryptographic integrity breach (hash mismatch)."""
    pass

class LockNotEstablishedError(RuntimeError):
    """Custom error raised if verification is attempted before lock creation."""
    pass


class PayloadManifestHashLock:
    """PMH: Manages cryptographic integrity lock across GSEP Stages 3 and 4.
    Ensures M-02 payload reviewed post-simulation is identical to the payload
    executed in testing (Stage 4).
    
    Uses canonical JSON serialization and respects configured exclusion lists to 
    ensure transient fields do not break integrity checks.
    """

    DEFAULT_ALGORITHM = 'SHA256'

    def __init__(self, hash_algorithm: str = DEFAULT_ALGORITHM, payload_type: str = 'M-02'):
        self.algorithm: str = hash_algorithm
        self.payload_type: str = payload_type
        self._manifest_hash: Optional[str] = None

    @property
    def lock_value(self) -> Optional[str]:
        """Provides read access to the stored hash lock."""
        return self._manifest_hash

    def _canonicalize(self, data: Dict[str, Any]) -> str:
        """
        1. Applies exclusion rules (removing transient/metadata fields).
        2. Ensures reproducible serialization (sorted keys, compact format).
        """
        # 1. Clean data based on payload configuration to ignore transient fields.
        cleaned_data = HashExclusionUtility.apply_exclusions(data, self.payload_type)

        # 2. Serialize reproducibly (sorted keys, compact representation)
        return json.dumps(cleaned_data, sort_keys=True, separators=(',', ':'))

    def _calculate_hash(self, data_string: str) -> str:
        """Calculates the hex digest of the encoded string."""
        h = hashlib.new(self.algorithm)
        h.update(data_string.encode('utf-8'))
        return h.hexdigest()

    def create_lock(self, mutation_payload: Dict[str, Any]) -> str:
        """Creates an immutable hash lock for the M-02 payload post-Stage 3 simulation.
        Returns the calculated hash.
        """
        canonical_data = self._canonicalize(mutation_payload)
        self._manifest_hash = self._calculate_hash(canonical_data)
        # Removed non-library print statement
        return self._manifest_hash

    def verify_lock(self, mutation_payload: Dict[str, Any]) -> bool:
        """Verifies the current M-02 payload against the stored hash lock (Stage 4 check)."""
        if self._manifest_hash is None:
            raise LockNotEstablishedError("PMH lock not yet established (Stage 3 process failure).")

        canonical_data = self._canonicalize(mutation_payload)
        current_hash = self._calculate_hash(canonical_data)

        if current_hash != self._manifest_hash:
            raise IntegrityError("M-02 Payload Tampering Detected: Hash Mismatch.")

        return True
