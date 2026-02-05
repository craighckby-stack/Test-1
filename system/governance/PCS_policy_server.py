import json
import logging
from typing import Dict, Any, List

# Configure a standardized logger for the Policy Constraint Server
logger = logging.getLogger('PCS_Server')

# Internal definition of core policy keys (Targeted for external modularization in policy_constants.py)
DEFAULT_ACVD_PATH = 'config/ACVD_constraints.json'

class ACVDKeys:
    VERSION = 'version'
    UTILITY_THRESHOLDS = 'utility_thresholds'
    POLICY_INVARIANTS = 'policy_invariants'
    REQUIRED_KEYS: List[str] = [VERSION, UTILITY_THRESHOLDS, POLICY_INVARIANTS]

class PolicyConstraintServer:
    """ 
    Policy and Constraint Server (PCS). 
    Responsible for reading, validating, and serving the definitive
    Axiomatic Constraint Vetting Document (ACVD) to governance agents.
    Acts as the Single Source of Policy Truth (SCoT), utilizing structured logging
    and robust type validation.
    """

    def __init__(self, acvd_path: str = DEFAULT_ACVD_PATH):
        self.acvd_path = acvd_path
        self.constraints: Dict[str, Any] = self._load_and_validate_acvd()
        
        version = self.constraints.get(ACVDKeys.VERSION, 'N/A')
        logger.info(f"ACVD v{version} successfully loaded and validated from {self.acvd_path}.")

    def _load_acvd_file(self) -> Dict[str, Any]:
        """ Handles file I/O and JSON parsing errors, ensuring immediate failure if core policy cannot be loaded."""
        try:
            with open(self.acvd_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError: 
            msg = f"Fatal Error: ACVD not found at {self.acvd_path}. Cannot guarantee axiomatic compliance."
            logger.critical(msg)
            raise RuntimeError(f"[PCS] {msg}")
        except json.JSONDecodeError as e:
            msg = f"ACVD structural JSON integrity breach near line {e.lineno}. Policy data corrupted."
            logger.critical(msg)
            raise RuntimeError(f"[PCS] {msg}")

    def _validate_structure(self, data: Dict[str, Any]):
        """ Ensures all critical ACVDKeys are present."""
        missing_keys = [key for key in ACVDKeys.REQUIRED_KEYS if key not in data]
        if missing_keys:
            msg = f"ACVD Structure Invalid: Missing essential governance keys: {', '.join(missing_keys)}. Halting."
            logger.critical(msg)
            raise ValueError(f"[PCS] {msg}")

    def _load_and_validate_acvd(self) -> Dict[str, Any]:
        """ Orchestrates loading and validation steps. """
        data = self._load_acvd_file()
        self._validate_structure(data)
        return data

    def get_utility_threshold(self, metric_key: str) -> float:
        """ Retrieves a specific utility threshold for TEMM validation (Axiom I), performing type enforcement. """
        thresholds = self.constraints.get(ACVDKeys.UTILITY_THRESHOLDS, {}) 
        
        if metric_key not in thresholds:
             logger.warning(f"Configuration Policy Gap: Threshold for '{metric_key}' not explicitly defined in ACVD.")
             raise KeyError(f"[PCS] Policy Error: Threshold for {metric_key} not defined.")
        
        value = thresholds[metric_key]
        
        try:
            # Enforce policy requirement: All thresholds must be float castable
            return float(value)
        except (ValueError, TypeError):
            msg = f"Data Type Integrity Failure: Threshold '{metric_key}'='{value}' is non-numeric, violating policy contract."
            logger.error(msg)
            raise TypeError(f"[PCS] {msg}")

    def get_invariants(self) -> Dict[str, Any]:
        """ Returns all axiomatic invariants for GAX policy enforcement. """
        return self.constraints[ACVDKeys.POLICY_INVARIANTS]
