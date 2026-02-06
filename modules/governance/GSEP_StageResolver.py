import json
from typing import Optional, Dict, Any, List, Tuple

# Assumption: ArtifactLocks is a singleton module providing lock status
from governance.artifact_locks import ArtifactLocks

# Define constants for robust state signaling
COMPLETION_SIGNAL = "CYCLE_COMPLETE"
INITIAL_STAGE = "L0"
FINAL_STAGE = "L6"

class GSEPStageResolver:
    """
    GSR (GSEP Stage Resolver):
    Utility module responsible for idempotently determining the current GSEP state 
    based on verified Artifact Locks (L_N) and reporting the next required stage. 
    Decouples state tracking from the GCO's arbitration function.

    Stages: L0 (INIT) -> L1 (VET_A) -> L2 (VET_B) -> L3 (PROOF) -> L4 (ADJ) -> L5 (COMMIT) -> L6 (EXEC).
    A verified L6 lock signals readiness for the next L0 cycle.
    """

    # Static definition of the GSEP phases and their canonical order.
    # L1 and L2 are explicitly differentiated for sequential locking accuracy.
    GSEP_PHASES: Dict[str, str] = {
        'L0': 'INITIATION',
        'L1': 'VET_LOCK_A',
        'L2': 'VET_LOCK_B', 
        'L3': 'PROOF',
        'L4': 'ADJ',
        'L5': 'COMMIT',
        'L6': 'EXECUTION'
    }
    
    # Pre-calculated list of keys for optimized sequencing and index lookup.
    _STAGE_LOCK_IDS: List[str] = list(GSEP_PHASES.keys())

    def __init__(self, lock_manager: ArtifactLocks):
        self.locks = lock_manager
        
    def get_stage_sequence(self) -> Tuple[str, ...]:
        """Returns the canonical order of stage lock IDs."""
        return tuple(self._STAGE_LOCK_IDS)

    def get_current_stage(self) -> Optional[str]:
        """
        Determines the highest successfully completed stage lock (L_N).
        Iterates the known sequence backwards using the optimized static list.
        """
        for stage_id in reversed(self._STAGE_LOCK_IDS):
            if self.locks.is_lock_verified(stage_id):
                return stage_id
        
        # If no locks are verified, we are pre-init.
        return None

    def get_next_stage(self) -> str:
        """
        Returns the required subsequent GSEP stage based on current lock status.
        Returns COMPLETION_SIGNAL if the L6 cycle is complete.
        """
        current_stage = self.get_current_stage()
        
        if current_stage is None:
            # Nothing locked yet, start at L0
            return INITIAL_STAGE

        if current_stage == FINAL_STAGE:
             # L6 is the final execution lock, signal readiness for a new cycle start
             return COMPLETION_SIGNAL 

        # Optimized standard sequential transition using static index list
        try:
            current_index = self._STAGE_LOCK_IDS.index(current_stage)
            # We check the current index against the length to ensure we don't index past L6
            if current_index < len(self._STAGE_LOCK_IDS) - 1:
                next_stage_id = self._STAGE_LOCK_IDS[current_index + 1]
                return next_stage_id
            else:
                # Should be caught by the FINAL_STAGE check, but serves as a safety catch
                return COMPLETION_SIGNAL
            
        except ValueError:
             # Indicates a critical corruption or unknown lock ID was found.
             raise RuntimeError(f"Unknown GSEP stage lock detected: {current_stage}")

    def check_sequencing_integrity(self, target_stage: str) -> bool:
        """Validates if transitioning to the target_stage respects strict sequencing."""
        next_expected_stage = self.get_next_stage()
        
        if next_expected_stage == COMPLETION_SIGNAL:
            # If the cycle is complete, the only valid next target is a fresh start (L0)
            return target_stage == INITIAL_STAGE

        return target_stage == next_expected_stage

    def resolve_state_payload(self) -> Dict[str, Any]:
        """Provides a consolidated state report for the GCO."""
        next_stage = self.get_next_stage()
        return {
            "current_stage_lock": self.get_current_stage(),
            "next_required_stage": next_stage,
            # We validate sequencing against the computed next required stage.
            "sequencing_valid": self.check_sequencing_integrity(next_stage),
            "gsep_mandate_version": "V94.1",
            "is_cycle_complete": (next_stage == COMPLETION_SIGNAL)
        }