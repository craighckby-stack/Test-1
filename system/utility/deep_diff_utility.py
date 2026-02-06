# system/utility/deep_diff_utility.py: State Differential Calculation Utility

from typing import Dict, Any, List, Union, Iterator

# Define types for robust state management and JSON Patch compliance (RFC 6902)
JsonValue = Union[str, int, float, bool, None, Dict[str, Any], List[Any]]
State = Dict[str, Any]
JsonPatchOperation = Dict[str, Any] 
Differential = List[JsonPatchOperation] # Standardizing output to JSON Patch list format

def _get_op_details(op: str, path: str, value: Any = None, old_value: Any = None) -> JsonPatchOperation:
    """Helper to structure a JSON Patch operation dictionary.

    We optionally include 'from' data for easier state rollback and auditability, 
    even though it is not strictly required by RFC 6902 for all operations.
    """
    details: JsonPatchOperation = {"op": op, "path": path}
    if value is not None and op in ["add", "replace", "test"]:
        details["value"] = value
    if old_value is not None and op in ["replace", "remove"]:
        details["from"] = old_value
    return details

def _deep_compare(old: JsonValue, new: JsonValue, path: str = "") -> Iterator[JsonPatchOperation]:
    """
    Recursive generator for calculating differences using JSON Pointer path notation.
    Yields standardized JSON Patch operations (RFC 6902).
    """

    # 1. Base case: Identity or scalar differences
    if old == new:
        return

    # Handle type change (always a replacement at this level)
    if type(old) != type(new):
        yield _get_op_details("replace", path, new, old)
        return

    # 2. Recurse into Dictionaries (Objects)
    if isinstance(old, dict) and isinstance(new, dict):
        old_keys = set(old.keys())
        new_keys = set(new.keys())

        # Removals
        for key in old_keys - new_keys:
            current_path = f"{path}/{key}"
            yield _get_op_details("remove", current_path, old_value=old[key])

        # Additions and Modifications
        for key in new_keys:
            current_path = f"{path}/{key}"
            if key not in old_keys:
                yield _get_op_details("add", current_path, new[key])
            else:
                yield from _deep_compare(old[key], new[key], current_path)
        return

    # 3. Recurse into Lists (Arrays)
    if isinstance(old, list) and isinstance(new, list):
        len_old = len(old)
        len_new = len(new)
        
        # Iterate over the minimum length for modifications/replaces
        min_len = min(len_old, len_new)
        for i in range(min_len):
            current_path = f"{path}/{i}"
            yield from _deep_compare(old[i], new[i], current_path)

        # Handle size change
        if len_new > len_old:
            # Additions
            for i in range(len_old, len_new):
                current_path = f"{path}/{i}"
                yield _get_op_details("add", current_path, new[i])
        
        elif len_old > len_new:
            # Removals must iterate backward (high index to low index) for stable patching
            for i in range(len_old - 1, len_new - 1, -1):
                current_path = f"{path}/{i}"
                yield _get_op_details("remove", current_path, old_value=old[i])
        
        return

    # 4. Handle Scalar/Atomic types (Must be different if execution reaches here)
    yield _get_op_details("replace", path, new, old)


def calculate_deep_diff(old_state: State, new_state: State) -> Differential:
    """
    Generates a strict, standardized JSON Patch differential (Delta Psi) based on recursive
    comparison of two state structures (dicts/lists).
    
    Returns:
        A list of JSON Patch operations (RFC 6902).
    """
    if old_state == new_state:
        return []
        
    return list(_deep_compare(old_state, new_state, path=""))