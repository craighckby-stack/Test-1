import json
from typing import Dict, Any

# Path defined in ACVD Component listing
ACVD_PATH = 'config/ACVD_constraints.json'

class PolicyConstraintServer:
    """ 
    Policy and Constraint Server (PCS). 
    Responsible for reading, validating, and serving the definitive
    Axiomatic Constraint Vetting Document (ACVD) to governance agents.
    Acts as the Single Source of Policy Truth (SCoT).
    """
    def __init__(self):
        self.constraints = self._load_and_validate_acvd()
        print(f"[PCS] ACVD v{self.constraints['version']} loaded and validated.")

    def _load_and_validate_acvd(self) -> Dict[str, Any]:
        """ Load the ACVD JSON and perform critical structural validation. """
        try:
            with open(ACVD_PATH, 'r') as f:
                data = json.load(f)
        except FileNotFoundError: 
            raise RuntimeError(f"[PCS] Fatal Error: ACVD not found at {ACVD_PATH}.")
        except json.JSONDecodeError:
            raise RuntimeError("[PCS] Fatal Error: ACVD structural JSON integrity breach.")
            
        # Critical Policy Structure Check (Minimal requirements for GAX operation)
        required_keys = ['version', 'utility_thresholds', 'policy_invariants']
        if not all(key in data for key in required_keys):
            raise ValueError("[PCS] ACVD Structure Invalid: Missing essential governance keys.")
            
        return data

    def get_utility_threshold(self, metric_key: str) -> float:
        """ Retrieves a specific utility threshold for TEMM validation (Axiom I). """
        thresholds = self.constraints.get('utility_thresholds', {}) 
        if metric_key not in thresholds:
             raise KeyError(f"[PCS] Policy Error: Threshold for {metric_key} not defined in ACVD.")
        return float(thresholds[metric_key])

    def get_invariants(self) -> Dict[str, Any]:
        """ Returns all axiomatic invariants for GAX policy enforcement. """
        return self.constraints.get('policy_invariants', {})
