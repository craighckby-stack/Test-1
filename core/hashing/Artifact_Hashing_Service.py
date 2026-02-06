# core/hashing/Artifact_Hashing_Service.py
# Purpose: Provides deterministic hashing utilities for complex state artifacts (e.g., ASM, TEDS) to ensure consistency and verifiability required by the XEL schema.

import json
import hashlib
from typing import Dict, Any
from .HashingErrors import HashingInitializationError, ArtifactSerializationError # Import specialized errors

# Constants
DEFAULT_ALGORITHM = 'sha256'

class ArtifactHashingService:
    """
    Service responsible for generating canonical and deterministic hashes for
    artifact dictionaries required for XEL integrity checks.
    """

    @staticmethod
    def _serialize_artifact(artifact_data: Dict[str, Any]) -> bytes:
        """Helper to perform canonical JSON serialization."""
        try:
            # Canonical serialization: sorted keys, minimal separators, utf-8 encoding.
            return json.dumps(
                artifact_data,
                sort_keys=True,
                separators=(',', ':')
            ).encode('utf-8')
        except TypeError as e:
            # Raise specialized error for poor artifact structure
            raise ArtifactSerializationError(f"Artifact data contains unserializable types: {e}")
        except Exception as e:
            raise RuntimeError(f"Unexpected serialization error during hashing: {e}")


    @staticmethod
    def get_canonical_hash(
        artifact_data: Dict[str, Any], 
        algorithm: str = DEFAULT_ALGORITHM
    ) -> str:
        """
        Generates a deterministic hash for a given artifact dictionary using the specified algorithm.

        Args:
            artifact_data: The dictionary representation of the artifact state.
            algorithm: The hashing algorithm to use (e.g., 'sha256'). Defaults to sha256.

        Returns:
            The hexadecimal hash digest string.
        """
        try:
            serialized_data = ArtifactHashingService._serialize_artifact(artifact_data)
            
            h = hashlib.new(algorithm)
            h.update(serialized_data)
            return h.hexdigest()
        except ValueError:
            # Raised if hashlib.new(algorithm) fails (algorithm not found)
            raise HashingInitializationError(f"Unsupported or invalid hashing algorithm specified: {algorithm}")
        except Exception as e:
            raise RuntimeError(f"Failed to generate canonical hash using {algorithm}: {e}")

    @staticmethod
    def verify_artifact_integrity(
        expected_hash: str, 
        artifact_data: Dict[str, Any], 
        algorithm: str = DEFAULT_ALGORITHM
    ) -> bool:
        """
        Verifies if the calculated hash of the artifact matches the provided expected_hash.

        Args:
            expected_hash: The known hash value the artifact should possess.
            artifact_data: The artifact dictionary to verify.
            algorithm: The hashing algorithm used.

        Returns:
            True if the hashes match, False otherwise.
        """
        try:
            calculated_hash = ArtifactHashingService.get_canonical_hash(artifact_data, algorithm)
            
            # Use constant time comparison for security
            return hashlib.compare_digest(calculated_hash, expected_hash)
        except Exception:
            # If hashing fails during verification (e.g., bad artifact data or unsupported algorithm), return False
            return False

# Interface details for CRoT/SGS integration:
# The service uses canonical JSON to ensure that artifacts processed by different 
# systems yield identical hashes.