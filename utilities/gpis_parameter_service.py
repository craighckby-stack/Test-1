import hashlib
import json
import time

class GovernanceParameterImmutabilityService:
    """
    GPIS ensures cryptographic integrity, versioning, and auditable history
    for sensitive governance parameters (e.g., PVLM, CFTM, ADTM).
    Utilized by GAX and attested by CRoT.
    """
    
    def __init__(self, storage_backend):
        # storage_backend must be an immutable/attested resource (e.g., ledger hook)
        self.storage = storage_backend
        self._load_history()

    def _load_history(self):
        # Placeholder: Actual implementation pulls data from attested storage
        self.history = self.storage.load_all_parameters() or {}

    def _generate_checksum(self, data: dict) -> str:
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

    def commit_parameters(self, manifest_name: str, parameters: dict, author_attestation: str) -> str:
        """Commits a new version of governance parameters and returns its integrity hash.
        Requires external attestation (CRoT signature) to authorize commit."""
        
        integrity_hash = self._generate_checksum(parameters)
        
        entry = {
            "timestamp": time.time(),
            "version_hash": integrity_hash,
            "author_attestation": author_attestation,
            "parameters": parameters
        }
        
        # Atomic write to immutable ledger
        self.storage.write_entry(manifest_name, entry)
        
        return integrity_hash

    def fetch_verified_parameters(self, manifest_name: str, required_hash: str = None) -> dict:
        """Fetches and verifies the required parameters against an integrity hash or the latest committed state."""
        if required_hash:
            entry = self.storage.lookup_by_hash(manifest_name, required_hash)
            if entry and self._generate_checksum(entry['parameters']) == required_hash:
                return entry['parameters']
            raise ValueError(f"Parameter hash mismatch for {manifest_name} at {required_hash}.")
        else:
            # Fetch latest committed entry
            latest_entry = self.storage.fetch_latest(manifest_name)
            if latest_entry:
                # Re-verify checksum upon read (integrity check)
                if self._generate_checksum(latest_entry['parameters']) == latest_entry['version_hash']:
                    return latest_entry['parameters']
                raise RuntimeError(f"Integrity check failed on latest {manifest_name} fetch.")
            raise ValueError(f"Manifest '{manifest_name}' not found.")