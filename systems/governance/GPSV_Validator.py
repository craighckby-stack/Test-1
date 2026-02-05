# systems/governance/GPSV_Validator.py

import json
from systems.core.RACM import RiskAssessmentComponentManager

class GovernanceParameterSecurityValidator:
    """
    GPSV (Governance Parameter Security Validator):
    Acts as an intermediary integrity gate for updates proposed to the 
    Schema and Configuration Registry (SCR) constraints. Ensures that 
    proposed dynamic thresholds (e.g., S-01 Trust Minimum, S-02 Risk Ceiling) 
    do not compromise the integrity rules mandated by the AOC.
    """

    def __init__(self, racm: RiskAssessmentComponentManager, system_boundary_contract):
        self.racm = racm
        self.sbc = system_boundary_contract
        self.FAILURE_MODEL_PATH = "config/governance/failure_modes.json"

    def _load_failure_modes(self):
        """Loads critical security metrics and governance parameter ranges."""
        try:
            with open(self.FAILURE_MODEL_PATH, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise RuntimeError("CRITICAL: Governance failure modes configuration missing.")

    def validate_proposed_parameters(self, proposed_scr_updates: dict) -> bool:
        """
        Validates if proposed SCR updates maintain minimum systemic security posture.

        The validation process involves:
        1. Checking bounds compliance against the SBC definition.
        2. Running differential risk simulation using RACM.
        """
        failure_modes = self._load_failure_modes()
        
        # 1. Check Mandatory Threshold Floor/Ceiling
        for param, proposed_value in proposed_scr_updates.items():
            if param in failure_modes['mandatory_limits']:
                limits = failure_modes['mandatory_limits'][param]
                
                # Enforce S-01 Trust minimum
                if param == "S-01_Threshold" and proposed_value < limits['min']:
                    print(f"GPSV Veto: S-01 Trust {proposed_value} below hard minimum {limits['min']}")
                    return False
                
                # Enforce S-02 Risk maximum
                if param == "S-02_RiskCeiling" and proposed_value > limits['max']:
                    print(f"GPSV Veto: S-02 Risk {proposed_value} above hard maximum {limits['max']}")
                    return False

        # 2. Differential Risk Simulation
        # Simulate how the new parameters affect system risk profile
        sim_result = self.racm.simulate_risk_impact(proposed_scr_updates)
        
        if sim_result['risk_delta'] > failure_modes['max_tolerable_risk_increase']:
            print(f"GPSV Veto: Simulation shows intolerable risk increase ({sim_result['risk_delta']}).")
            return False

        return True
