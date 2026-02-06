import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional

# --- Custom Exceptions for robust service handling ---
class GPISIntegrityError(Exception):
    """Raised when parameter checksum verification fails."""
    pass

class GPISManifestNotFound(Exception):
    """Raised when the specified manifest name is not found in the storage."""
    pass

# We assume a formal ImmutableLedgerInterface ABC exists elsewhere (Scaffolding proposal)
class GovernanceParameterImmutabilityService:
    """
    GPIS ensures cryptographic integrity, versioning, and auditable history
    for sensitive governance parameters (e.g., PVLM, CFTM, ADTM).
    Utilized by GAX and attested by CRoT.

    It operates purely as a transaction and verification layer over an
    immutable storage backend.
    """

    # storage_backend must implement ImmutableLedgerInterface
    def __init__(self, storage_backend: Any):
        """Initializes GPIS with a compliant immutable storage backend."""
        # Dependency injection for the immutable/attested resource
        self.storage = storage_backend

    def _generate_checksum(self, data: Dict[str, Any]) -> str:
        """Generates a deterministic SHA256 checksum for the parameter dictionary."""
        # Use compact separators and sorted keys for canonical JSON output
        data_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

    def commit_parameters(
        self, 
        manifest_name: str, 
        parameters: Dict[str, Any], 
        author_attestation: str,
        parent_hash: Optional[str] = None 
    ) -> str:
        """Commits a new version of governance parameters and returns its integrity hash.
        Includes parent_hash for explicit chaining/auditing.
        """
        
        integrity_hash = self._generate_checksum(parameters)
        
        entry = {
            "timestamp": datetime.utcnow().isoformat(), # Standardized ISO 8601 UTC
            "version_hash": integrity_hash,
            "parent_hash": parent_hash,
            "author_attestation": author_attestation,
            "parameters": parameters
        }
        
        # Storage is assumed to handle atomicity and indexing
        self.storage.write_entry(manifest_name, integrity_hash, entry)
        
        return integrity_hash

    def fetch_verified_parameters(self, manifest_name: str, required_hash: Optional[str] = None) -> Dict[str, Any]:
        """Fetches and cryptographically verifies the required parameters against 
        an integrity hash or the latest committed state.
        """
        
        if required_hash:
            entry = self.storage.lookup_by_hash(manifest_name, required_hash)
            if not entry:
                raise GPISManifestNotFound(f"Manifest '{manifest_name}' or hash '{required_hash}' not found.")
        else:
            # Fetch latest committed entry
            entry = self.storage.fetch_latest(manifest_name)
            if not entry:
                raise GPISManifestNotFound(f"Manifest '{manifest_name}' not found.")
            required_hash = entry['version_hash'] 
        
        # Post-fetch verification (essential integrity check)
        actual_hash = self._generate_checksum(entry['parameters'])

        if actual_hash != required_hash:
            raise GPISIntegrityError(
                f"Integrity check failed for {manifest_name}. Expected {required_hash}, got {actual_hash}."
            )
        
        return entry['parameters']
