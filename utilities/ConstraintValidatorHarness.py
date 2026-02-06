import json
from typing import Dict, Any, Optional

# --- System Mock Logger (Should be replaced by system.core.Logger in production) ---
class ConsoleLogger:
    def info(self, msg: str): print(f"[INFO] {msg}")
    def error(self, msg: str): print(f"[ERROR] {msg}")
    def warn(self, msg: str): print(f"[WARNING] {msg}")

LOG = ConsoleLogger()

def load_constraints(path: str = 'config/pim_constraints.json') -> Dict[str, Any]:
    """Loads PIM constraint specifications using proper error handling and logging."""
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            LOG.info(f"Successfully loaded constraints from {path}.")
            return data
    except FileNotFoundError:
        LOG.error(f"FATAL: Constraint file not found at {path}. Harness operating in passive mode.")
        return {}
    except json.JSONDecodeError:
        LOG.error(f"FATAL: Invalid JSON structure in {path}. Check file integrity.")
        return {}

class ConstraintValidatorHarness:
    """
    Simulates PIM behavior for pre-flight validation of constraints.
    Refactored to be entirely data-driven, looking up required limits and hashes
    from the loaded constraints structure.
    """
    def __init__(self):
        self.constraints = load_constraints()
        self.p_set_rules = self.constraints.get('P_SET_Rules', [])
        self.gax_limits = self.constraints.get('GAX_Limits', {})
        self.temporal_limits = self.constraints.get('Temporal_Limits', {})
        
        if not self.constraints:
            LOG.warn("Harness initialized in passive (unconstrained) mode.")
        else:
            LOG.info(f"Harness Active. Loaded {len(self.p_set_rules)} P-Set rules and {len(self.temporal_limits)} temporal definitions.")

    def _get_temporal_limits(self, stage_name: str) -> Optional[Dict[str, int]]:
        """Retrieves soft and hard limits for a specific stage from constraints."""
        limits = self.temporal_limits.get(stage_name)
        if limits and all(k in limits for k in ['soft_limit_ms', 'hard_limit_ms']):
            return limits
        LOG.warn(f"Temporal constraints missing or malformed for stage: {stage_name}")
        return None
    
    def run_gax_check(self, axiom_id: str, verifiable_artifact_hash: str) -> Dict[str, Any]:
        """
        G2 Check: Mocks the comparison of verifiable artifact hash against 
        the expected hash defined in the constraint structure (GAX_Limits).
        """
        check_spec = self.gax_limits.get(axiom_id)
        
        if not check_spec:
            return {"success": True, "trigger": None, "message": f"GAX check {axiom_id} is unconstrained."}
        
        expected_hash = check_spec.get('expected_hash')
        trigger_code = check_spec.get('trigger', 'P-M02')

        if verifiable_artifact_hash != expected_hash:
            LOG.error(f"Integrity Breach Candidate: {axiom_id} hash mismatch.")
            return {
                "success": False, 
                "trigger": trigger_code, 
                "message": f"{axiom_id} violation. Expected '{expected_hash}'."
            }
        
        return {"success": True, "trigger": None, "message": f"{axiom_id} validation successful."}

    def evaluate_temporal_violation(self, stage_name: str, duration_ms: int) -> Dict[str, Any]:
        """Evaluates P-M01 linearity violation based on dynamic limits retrieved by stage_name."""
        limits = self._get_temporal_limits(stage_name)

        if not limits:
            return {"stage": stage_name, "trigger": None, "severity": "Unconstrained"}

        soft_limit_ms = limits['soft_limit_ms']
        hard_limit_ms = limits['hard_limit_ms']

        if duration_ms > hard_limit_ms:
            LOG.warn(f"HARD HALT THRESHOLD hit: {stage_name} exceeded {hard_limit_ms}ms.")
            return {"stage": stage_name, "trigger": "P-M01", "severity": "Hard", "action": "Integrity Halt (IH)"}
        elif duration_ms > soft_limit_ms:
            LOG.info(f"Soft THRESHOLD hit: {stage_name} exceeded {soft_limit_ms}ms.")
            return {"stage": stage_name, "trigger": "P-M01", "severity": "Soft", "action": "Log & Proceed"}
        
        return {"stage": stage_name, "trigger": None, "severity": "None", "action": "Compliant"}

if __name__ == "__main__":
    # Test Requires config/pim_constraints.json defined by the scaffold.
    
    harness = ConstraintValidatorHarness()
    
    # 1. Test Temporal Constraint (P-M01) - Hard Violation Scenario based on configured limits (1000ms hard)
    temporal_result = harness.evaluate_temporal_violation("S05/DHC Block", 1500)
    print(f"\nTemporal Test (1500ms): {temporal_result}")
    
    # 2. Test Critical Fault (P-M02 / GAX I) - Mismatch
    critical_result = harness.run_gax_check("GAX I", "FEE9988D44E_INCORRECT")
    print(f"GAX I Critical Mismatch Test: {critical_result}")
    
    # 3. Test Critical Fault (GAX I) - Match (Expected: 1a2b3c4d5e)
    match_result = harness.run_gax_check("GAX I", "1a2b3c4d5e")
    print(f"GAX I Critical Match Test: {match_result}")

