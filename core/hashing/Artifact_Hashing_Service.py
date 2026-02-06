# Artifact_Hashing_Service.py
# Purpose: Provides deterministic hashing utilities for complex state artifacts (e.g., ASM, TEDS) to ensure consistency and verifiability required by the XEL schema.

import json
import hashlib

class ArtifactHashingService:
    @staticmethod
    def get_canonical_hash(artifact_data: dict) -> str:
        """
        Generates a deterministic SHA256 hash for a given artifact dictionary.
        Requires canonical JSON serialization (sorted keys) before hashing.
        """
        try:
            # Canonical JSON serialization: ensure sorted keys, no separators for compactness.
            serialized_data = json.dumps(
                artifact_data,
                sort_keys=True,
                separators=(',', ':')
            ).encode('utf-8')
            
            return hashlib.sha256(serialized_data).hexdigest()
        except Exception as e:
            raise RuntimeError(f"Failed to generate canonical hash: {e}")

    @staticmethod
    def verify_hash_chain(pre_hash: str, post_hash: str, modified_artifact: dict) -> bool:
        """
        Verifies that the post_hash corresponds to the modified artifact.
        In a production environment, this would also confirm if pre_hash was the hash of the *previous* artifact state.
        """
        calculated_post_hash = ArtifactHashingService.get_canonical_hash(modified_artifact)
        return calculated_post_hash == post_hash

# Interface details for CRoT/SGS integration: