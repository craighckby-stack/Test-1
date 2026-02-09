import json
import typing
import collections
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from pathlib import Path
from .HashingErrors import ArtifactSerializationError


class CanonicalJSONEncoder(json.JSONEncoder):
    """
    Custom encoder to handle types not natively serializable by standard JSON,
    ensuring deterministic output for hashing purposes.
    
    This encoder prioritizes consistency and robustness for core AGI data structures.
    """
    def default(self, obj):
        # 1. Handle non-native iterables deterministically
        if isinstance(obj, set):
            # Convert sets to sorted lists to ensure canonical order
            return sorted(list(obj))
        
        # Tuples are treated as lists for consistency
        if isinstance(obj, tuple):
            return list(obj)

        # 2. Handle common complex types by converting to deterministic strings
        # Added pathlib.Path handling for canonical file system references.
        if isinstance(obj, (datetime, Decimal, UUID, Path)):
            return str(obj)

        # 3. Handle binary data by converting to canonical hex string (Crucial for artifact integrity)
        if isinstance(obj, bytes):
            return obj.hex()

        # 4. Handle mappings that might not be dicts (e.g., OrderedDict if present)
        if isinstance(obj, collections.Mapping) and not isinstance(obj, dict):
            return dict(obj)
            
        # Let the base class default raise the TypeError for truly unsupported types
        return super().default(obj)

def serialize_for_hashing(artifact: typing.Any) -> bytes:
    """Converts an arbitrary Python object into a canonical byte string for hashing.

    Canonical serialization ensures that the byte output is consistent across different
    execution environments, specifically by enforcing sorted dictionary keys and
    handling complex Python types deterministically (e.g., bytes, sets, file paths).

    Args:
        artifact: The data structure (typically a dictionary or list) to serialize.

    Returns:
        bytes: The deterministic byte representation.

    Raises:
        ArtifactSerializationError: If the data structure contains non-serializable types.
    """
    try:
        # Ensure consistent order using the custom encoder and standard canonical JSON settings
        serialized_string = json.dumps(
            artifact,
            sort_keys=True,
            separators=(',', ':'),
            cls=CanonicalJSONEncoder
        )
        return serialized_string.encode('utf-8')
    except TypeError as e:
        # Enhanced error context for improved Error Handling capability: report the top-level type and suggest checking nested elements.
        offending_type = type(artifact)
        error_message = (
            f"Failed to serialize artifact of type '{offending_type}'. "
            f"Check nested elements for non-JSON serializable types (e.g., functions, class instances, unhandled objects). "
            f"Original error: {e}"
        )
        raise ArtifactSerializationError(reason=error_message, data_type=str(offending_type)) from e
    except Exception as e:
        # Ensures all unexpected exceptions are wrapped in the specific domain error type.
        raise ArtifactSerializationError(reason=f"Unexpected serialization error: {e}") from e
