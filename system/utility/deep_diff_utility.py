# system/utility/deep_diff_utility.py: State Differential Calculation Utility

from typing import Dict, Any

Differential = Dict[str, Any]
State = Dict[str, Any]

def calculate_strict_diff(old_state: State, new_state: State) -> Differential:
    """
    Generates a strict, reversible state differential (Delta Psi) based on key changes.
    
    This function should implement robust logic for recursive deep comparison 
    and format the output in a standardized way suitable for patching (e.g., a simplified JSON Patch format).
    
    Returns:
        A dictionary representing the differential. Example format:
        {
          'key_a': {'op': 'replace', 'from': 10, 'to': 20},
          'key_b': {'op': 'add', 'to': [1, 2]},
          'key_c': {'op': 'remove', 'from': 'old_value'}
        }
    """
    if old_state == new_state:
        return {}

    # NOTE: Placeholder logic. Production implementation requires complex, optimized tree traversal.
    diff = {}

    # Check for modifications/additions
    for key, new_value in new_state.items():
        if key not in old_state:
            diff[key] = {"op": "add", "to": new_value}
        elif old_state[key] != new_value:
            diff[key] = {"op": "replace", "from": old_state[key], "to": new_value}

    # Check for deletions
    for key in old_state:
        if key not in new_state:
            diff[key] = {"op": "remove", "from": old_state[key]}
            
    return diff
