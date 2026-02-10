import json
import typing
import collections
from decimal import Decimal
from uuid import UUID
from datetime import datetime, date, timezone
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

# AGI-KERNEL Improvement (Cycle 3): Anticipatory imports for future data handling determinism (Logic/Memory Capability)
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


class CanonicalJSONEncoder(json.JSONEncoder):
    """
    Custom encoder to handle types not natively serializable by standard JSON,
    ensuring deterministic output for hashing purposes.
    
    This encoder prioritizes consistency and robustness for core AGI data structures.
    
    AGI-KERNEL Improvement (Cycle 5):
    1. Added explicit handling for non-string dictionary keys, converting them canonically to strings.
    2. Enforced strict UTC conversion for timezone-aware datetimes to guarantee cross-environment hashing consistency.
    
    AGI-KERNEL Improvement (Cycle 6):
    3. Introduced deterministic handling for non-finite floating-point numbers (NaN, Infinity), 
       crucial for stable hashing of mathematical outputs from /agents and /metrics.

    AGI-KERNEL Improvement (Cycle 7):
    4. Implemented null-value filtering for custom objects/dataclasses to ensure hash stability.
    5. Added deterministic handling for buffer types (bytearray, memoryview).
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Cycle 2: Initialize set to track IDs of custom objects currently being serialized
        self._visited = set()

    def default(self, obj):
        
        # 0a. Handle Data Science Types deterministically (Anticipatory AGI Logic)
        if NUMPY_AVAILABLE and isinstance(obj, np.ndarray):
            # Convert NumPy arrays to standard lists for deterministic hashing.
            return obj.tolist()
        
        if PANDAS_AVAILABLE and isinstance(obj, pd.Timestamp):
            # Convert Pandas timestamps to canonical ISO format.
            return obj.isoformat()

        # 0b. Handle Enumerations (Crucial for deterministic configs/governance data)
        if ENUM_AVAILABLE and isinstance(obj, enum.Enum):
            # Prioritize the enum's value if available, otherwise use its name.
            try:
                return obj.value
            except AttributeError:
                return obj.name

        # AGI-KERNEL Improvement (Cycle 6): Handle non-finite floats deterministically
        if isinstance(obj, float):
            # Check for NaN (NaN is the only float not equal to itself)
            if obj != obj: 
                return {"__float__": "NaN"}
            if obj == float('inf'):
                return {"__float__": "Infinity"}
            if obj == float('-inf'):
                return {"__float__": "-Infinity"}
            # Otherwise, allow standard JSON float serialization

        # AGI-KERNEL Improvement (Cycle 4): Handle complex numbers required by /metrics and advanced /agents math models.
        if isinstance(obj, complex):
            # Represent complex numbers explicitly as an object for canonical hashing.
            return {"__complex__": True, "real": obj.real, "imag": obj.imag}

        # 1. Handle non-native iterables deterministically
        if isinstance(obj, set) or isinstance(obj, frozenset):
            # Convert sets/frozensets to sorted lists to ensure canonical order
            return sorted(list(obj))
        
        if isinstance(obj, tuple):
            # AGI-KERNEL Improvement (Cycle 4): Explicitly handle NamedTuples to preserve field meaning.
            if hasattr(obj, '_asdict') and callable(obj._asdict):
                return obj._asdict()
            # Standard tuples (non-named) are treated as lists for consistency
            return list(obj)

        # AGI-KERNEL Improvement (Cycle 1): Handle Deques, common in /agents for history tracking.
        if isinstance(obj, collections.deque):
            return list(obj)

        # 2. Handle common complex types by converting to deterministic strings
        if isinstance(obj, datetime):
            # AGI-KERNEL Improvement (Cycle 5): Enforce UTC conversion for aware datetimes and standardize output format.
            if obj.tzinfo is not None and obj.tzinfo.utcoffset(obj) is not None:
                # Convert to UTC and remove tzinfo for clean ISO serialization
                obj = obj.astimezone(timezone.utc).replace(tzinfo=None)
                # Append 'Z' to explicitly mark canonical UTC time
                return obj.isoformat() + 'Z'
            
            # If naive, assume UTC for canonical consistency in core systems and mark 'Z'
            if obj.tzinfo is None:
                return obj.isoformat() + 'Z'
            
            # Fallback for other tz-aware datetimes (should be rare/specific offsets)
            return obj.isoformat()
            
        if isinstance(obj, date):
            return obj.isoformat()

        # Standard string conversion for other canonical types
        if isinstance(obj, Decimal):
            return str(obj)
        
        if isinstance(obj, UUID):
            return str(obj)
            
        if isinstance(obj, Path):
            # Cycle 3 Refinement: Use as_posix() to ensure consistent path separators across OS platforms for hashing integrity.
            return obj.as_posix()

        # 3. Handle binary data and buffer types (Crucial for artifact integrity)
        if isinstance(obj, bytes):
            return obj.hex()
        
        # AGI-KERNEL Improvement (Cycle 7): Handle memoryview and bytearray buffers deterministically.
        if isinstance(obj, (bytearray, memoryview)):
            # Convert buffers to bytes first, then use hex representation for canonical string
            return bytes(obj).hex()

        # 4. Handle mappings (dictionaries, ordered dicts, etc.)
        # AGI-KERNEL Improvement (Cycle 5): Ensure all mapping keys are strings for JSON compliance, 
        # handling non-string keys deterministically (e.g., tuple or number keys).
        if isinstance(obj, collections.Mapping):
            new_dict = {}
            for k, v in obj.items():
                if isinstance(k, str):
                    new_dict[k] = v
                else:
                    # Convert non-string keys to their canonical string representation
                    # This guarantees JSON compliance and deterministic key representations.
                    new_dict[str(k)] = v
            return new_dict
            
        # 5. AGI Logic: Handle custom class instances that don't belong to standard libraries
        if not type(obj).__module__.startswith(('builtins', 'collections', 'typing', 'datetime', 'decimal', 'pathlib', 'uuid', 'enum', 'numpy', 'pandas')):
            
            obj_id = id(obj)

            # Cycle 2 Improvement: Detect circularity in custom graphs
            if obj_id in self._visited:
                # Return a deterministic marker string instead of failing
                return f"<CANONICAL_CIRCULAR_REF:{obj_id}>"

            # Add ID before attempting serialization
            self._visited.add(obj_id)
            
            # 5a. Explicit dataclass serialization for structural integrity
            if DATACLASSES_AVAILABLE and is_dataclass(obj):
                # Use asdict() for robust, nested conversion of dataclass fields.
                # AGI-KERNEL Improvement (Cycle 7): Apply NULL filtering to dataclasses for hashing determinism.
                raw_dict = asdict(obj)
                # Filter out None values to ensure canonical output stability
                return {k: v for k, v in raw_dict.items() if v is not None}

            # Prioritize explicit interface if defined by the object itself
            if hasattr(obj, 'to_canonical_dict'):
                return obj.to_canonical_dict()
            
            # Fallback to serializing public attributes
            if hasattr(obj, '__dict__'):
                # Cycle 1 Improvement: Filter out internal/private attributes and callables
                # AGI-KERNEL Improvement (Cycle 7): Also filter out None values for hashing stability and compactness.
                safe_dict = {
                    k: v for k, v in obj.__dict__.items()
                    if not k.startswith('_') and not callable(v) and v is not None
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