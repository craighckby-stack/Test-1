from typing import Any, Dict, List
import json
import hashlib

class CanonicalSerializer:
    """Provides utilities for deterministic serialization (Canonical JSON) and 
    Merkle tree generation required for Artifact Integrity Cryptography (AICV).
    
    Ensures that artifact input is prepared consistently regardless of system state 
    to guarantee identical hashes for identical content."""

    @staticmethod
    def canonical_json(data: Dict[str, Any]) -> bytes:
        """Returns deterministically ordered, tightly packed JSON serialization."""
        # Ensures keys are sorted, separators are minimized, and byte encoding is consistent.
        try:
            return json.dumps(
                data,
                sort_keys=True,
                separators=(',', ':')
            ).encode('utf-8')
        except TypeError as e:
            raise ValueError(f"Input data is not JSON serializable: {e}")

    @staticmethod
    def generate_merkle_root(chunks: List[bytes], hash_constructor) -> str:
        """Generates the Merkle root hash from a list of serialized data chunks."""
        if not chunks:
            return hash_constructor(b'').hexdigest() # Empty tree hash
        
        # Implementation for generating leaf hashes and then computing internal nodes
        # Placeholder implementation for proof of concept:
        hashes = [hash_constructor(chunk).hexdigest() for chunk in chunks]
        
        # Recursive Merkle tree construction logic would follow here...
        # For immediate use, we concatenate and hash the sorted leaf hashes.
        combined_hash = ''.join(sorted(hashes)).encode('utf-8')
        return hash_constructor(combined_hash).hexdigest()
