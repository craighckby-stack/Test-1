import json
import typing
import collections
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from pathlib import Path
from .HashingErrors import ArtifactSerializationError

# AGI-KERNEL Improvement: Import dataclasses for robust structural data serialization (Cycle 1)
try:
    import dataclasses
    from dataclasses import is_dataclass, asdict
    DATACLASSES_AVAILABLE = True
except ImportError:
    DATACLASSES_AVAILABLE = False

# AGI-KERNEL Improvement: Import enum for deterministic serialization of configuration types (Cycle 1)
try:
    import enum
    ENUM_AVAILABLE = True
except ImportError:
    ENUM_AVAILABLE = False


class CanonicalJSONEncoder(json.JSONEncoder):
    """
    Custom encoder to handle types not natively serializable by standard JSON,
    ensuring deterministic output for hashing purposes.
    
    This encoder prioritizes consistency and robustness for core AGI data structures.
    AGI-KERNEL Improvement: Added logic for serializing custom objects via 
    __dict__ or explicit 'to_canonical_dict' method for better integration 
    with /agents and /emergent components. Also added explicit support for Python dataclasses and Enums.
    
    Cycle 1 Refinement: Enhanced the __dict__ fallback mechanism to filter out 
    private/internal attributes (starting with '_') and non-data callable attributes 
    to prevent non-deterministic hashing based on cache, transient internal state, 
    or unexpected methods. Explicitly added Enum support, and added explicit handling for collections.deque.
    """
    def default(self, obj):
        # 0. Handle Enumerations (Crucial for deterministic configs/governance data)
        if ENUM_AVAILABLE and isinstance(obj, enum.Enum):
            # Prioritize the enum's value if available, otherwise use its name.
            # This ensures consistent hashing for state defined by Enums.
            try:
                # Use value if defined, e.g., STATUS.SUCCESS = 1
                return obj.value
            except AttributeError:
                # Fallback to name if value is complex or missing
                return obj.name

        # 1. Handle non-native iterables deterministically
        if isinstance(obj, set):
            # Convert sets to sorted lists to ensure canonical order
            return sorted(list(obj))
        
        # Tuples are treated as lists for consistency
        if isinstance(obj, tuple):
            return list(obj)

        # AGI-KERNEL Improvement (Cycle 1): Handle Deques, common in /agents for history tracking.
        if isinstance(obj, collections.deque):
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
            
        # 5. AGI Logic: Handle custom class instances that don't belong to standard libraries
        if not type(obj).__module__.startswith(('builtins', 'collections', 'typing', 'datetime', 'decimal', 'pathlib', 'uuid', 'enum')):
            
            # 5a. Explicit dataclass serialization for structural integrity
            if DATACLASSES_AVAILABLE and is_dataclass(obj):
                # Use asdict() for robust, nested conversion of dataclass fields.
                return asdict(obj)

            # Prioritize explicit interface if defined by the object itself
            if hasattr(obj, 'to_canonical_dict'):
                return obj.to_canonical_dict()
            
            # Fallback to serializing public attributes
            if hasattr(obj, '__dict__'):
                # Cycle 1 Improvement: Filter out internal/private attributes starting with '_' 
                # and non-data callable attributes (functions/methods)
                # to improve determinism and prevent hashing transient state.
                safe_dict = {
                    k: v for k, v in obj.__dict__.items()
                    if not k.startswith('_') and not callable(v)
                }
                
                # Only return the dictionary if it contains actual serializable data
                if safe_dict:
                    return safe_dict
            
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
