# system/utility/patch_utility.py: State Patch Application Utility

from typing import Any, List, Dict
from jsonpatch import apply_patch, JsonPatchException

# Type aliases for clarity
Differential = List[Dict[str, Any]]
State = Dict[str, Any]

class StatePatcher:
    """
    Utility class for applying JSON Patch differentials (RFC 6902 Delta Psi) to state structures.
    This component focuses solely on the application mechanism.
    Requires the external 'jsonpatch' library.
    """

    @staticmethod
    def apply_differential(state: State, differential: Differential) -> State:
        """
        Applies a JSON Patch differential (Delta Psi) to a given state structure.
        
        Args:
            state: The target dictionary/state (or base state O_s).
            differential: The JSON Patch list (Delta).
            
        Returns:
            The patched (new) state (N_s).
        """
        try:
            # Ensure immutability by default: operate on a copy.
            return apply_patch(state, differential, in_place=False)
        except JsonPatchException as e:
            # High-fidelity error handling crucial for AGI state recovery and debug.
            raise RuntimeError(f"CRITICAL STATE ERROR [Patch Failure]: Failed to apply differential patch: {e}")
        except Exception as e:
            # Catch configuration or serialization issues that might surface during application.
            raise RuntimeError(f"CRITICAL STATE ERROR [Unhandled Exception]: during patch application: {e}")

    @staticmethod
    def calculate_inverse_patch(differential: Differential) -> Differential:
        """
        [PLACEHOLDER] Calculates the necessary inverse patch to revert the effects 
        of the original differential. 

        NOTE: Standard RFC 6902 patches are often not reversible without context (e.g., 'remove' op).
        True rollback relies on a robust Diff Utility component that generates reversible patches or provides state snapshots.
        """
        raise NotImplementedError(
            "Inverse patch calculation requires implementation in the associated DiffUtility or a custom rollback mechanism."
        )
