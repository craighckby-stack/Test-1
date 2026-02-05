import json
from typing import Optional, Dict, Any

# Assumption: ArtifactLocks is a singleton module providing lock status
from governance.artifact_locks import ArtifactLocks

class GSEPStageResolver:
    """
    GSR (GSEP Stage Resolver):
    Utility module responsible for idempotently determining the current GSEP state 
    based on verified Artifact Locks (L_N) and reporting the next required stage. 
    Decouples state tracking from the GCO's arbitration function.
    """

    def __init__(self, lock_manager: ArtifactLocks):
        self.locks = lock_manager
        self.GSEP_SEQUENCE = {
            'L0': 'INIT',
            'L1': 'VET',
            'L2': 'VET',
            'L3': 'PROOF',
            'L4': 'ADJ',
            'L5': 'COMMIT',
            'L6': 'EXEC'
        }

    def get_current_stage(self) -> Optional[str]:
        """Determines the highest successfully completed stage lock (L_N)."""
        for stage_id in reversed(list(self.GSEP_SEQUENCE.keys())):
            if self.locks.is_lock_verified(stage_id):
                return stage_id
        return None  # Should return L0 if initialization successful

    def get_next_stage(self) -> str:
        """Returns the required subsequent GSEP stage based on current lock status."""
        current_stage = self.get_current_stage()
        
        # Handle initial state or fully completed state
        if current_stage is None or current_stage == 'L6':
            # If L6 is hit, we return L0 for the next potential evolution cycle
            if current_stage == 'L6':
                 return 'L0_COMPLETE' # Special state signaling cycle completion
            return 'L0'

        # Standard sequential transition
        current_index = list(self.GSEP_SEQUENCE.keys()).index(current_stage)
        if current_index < len(self.GSEP_SEQUENCE) - 1:
            next_stage_id = list(self.GSEP_SEQUENCE.keys())[current_index + 1]
            return next_stage_id

        return 'L6' # Default safety return if index logic failed near end

    def check_sequencing_integrity(self, target_stage: str) -> bool:
        """Validates if transitioning to the target_stage respects strict sequencing."""
        next_expected_stage = self.get_next_stage()
        
        # L0_COMPLETE requires a fresh start (L0) and not subsequent L stages
        if next_expected_stage == 'L0_COMPLETE':
            return target_stage == 'L0'

        return target_stage == next_expected_stage

    def resolve_state_payload(self) -> Dict[str, Any]:
        """Provides a consolidated state report for the GCO."""
        return {
            "current_stage_lock": self.get_current_stage(),
            "next_required_stage": self.get_next_stage(),
            "sequencing_valid": self.check_sequencing_integrity(self.get_next_stage()),
            "gsep_mandate_version": "V94.1"
        }

# Note: This resolver assumes 'governance.artifact_locks' implements 'is_lock_verified(stage_id)'.
