# service/dse_metric_watchdog.py
import json
import logging
from typing import Dict, Any, Optional
# Assuming a DSE Manager interface exists for system control
from governance.core_system import DSE_Manager 

logger = logging.getLogger('DSE_Watchdog')
# Configure logger appropriately for sovereign operations (e.g., CRITICAL for IH events)

# --- Custom Exceptions for DSE System Robustness ---
class DSEWatchdogError(Exception):
    """Base exception for the Watchdog system."""
    pass

class ACVMIntegrityError(DSEWatchdogError):
    """Raised when the ACVM configuration is corrupt, missing required fields, or fails schema validation."""
    pass

class DSEMetricWatchdog:
    """
    Active agent responsible for real-time monitoring of GAX artifact telemetry 
    against predefined ACVM thresholds (P-M02). Triggers immediate Integrity Halt (IH)
    upon detection of threshold drift outside acceptable bounds between stages S01 and S08.
    """
    
    # Internal mapping constants (P-M02 Annex A reference). Defined here for immediate visibility.
    ARTIFACT_CONSTRAINT_MAPPING = {
        "CSR Snapshot": "GAX III",
        "ECVM Snapshot": "GAX II",
        "TEMM Snapshot": "GAX I" 
    }

    def __init__(self, acvm_path: str = 'config/acvm.json'):
        self._acvm_path = acvm_path
        self.dse_manager = DSE_Manager()
        # ACVM loading is now robustly validated upon initialization
        self.acvm_config = self._load_and_validate_acvm()
        logger.info("DSEMetricWatchdog initialized successfully with validated ACVM.")

    def _load_and_validate_acvm(self) -> Dict[str, Any]:
        """Loads and performs structural validation and type coercion on the ACVM configuration."""
        try:
            with open(self._acvm_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            err_msg = f"Critical DSE Dependency Failure: ACVM Configuration not found at {self._acvm_path}."
            logger.critical(err_msg)
            raise ACVMIntegrityError(err_msg)
        except json.JSONDecodeError as e:
            err_msg = f"ACVM Configuration failed JSON parsing: {e}."
            logger.critical(err_msg)
            raise ACVMIntegrityError(err_msg)

        # Strict check for all required constraint IDs (GAX I, II, III)
        required_constraints = set(self.ARTIFACT_CONSTRAINT_MAPPING.values())
        if not required_constraints.issubset(config.keys()):
            missing = required_constraints - set(config.keys())
            err_msg = f"ACVM schema validation failed. Missing core constraints: {missing}. (P-M02 Schema Violation)"
            logger.critical(err_msg)
            raise ACVMIntegrityError(err_msg)

        # P-T01 Optimization: Pre-process and coerce threshold values to float for runtime efficiency
        processed_config = {}
        for constraint_id, metrics in config.items():
            processed_metrics = {}
            for metric_key, thresholds in metrics.items():
                try:
                    min_val = float(thresholds.get("min", float('-inf')))
                    max_val = float(thresholds.get("max", float('inf')))
                    processed_metrics[metric_key] = {"min": min_val, "max": max_val}
                except (ValueError, TypeError) as e:
                    err_msg = f"ACVM data integrity error in {constraint_id}. Thresholds for {metric_key} are invalid: {e}"
                    raise ACVMIntegrityError(err_msg)
            processed_config[constraint_id] = processed_metrics

        return processed_config

    def ingest_telemetry(self, source_actor: str, artifact_name: str, metrics: Dict[str, float]):
        """ 
        Ingests high-fidelity metrics and synchronously evaluates them 
        against pre-validated ACVM thresholds (Fail-Fast Protocol).
        """
        
        constraint_id = self.ARTIFACT_CONSTRAINT_MAPPING.get(artifact_name)
        
        if constraint_id:
            self._evaluate_constraints(constraint_id, metrics)
        else:
            logger.warning(f"Unknown artifact '{artifact_name}' reported by {source_actor}. Skipping constraint evaluation.")

    def _evaluate_constraints(self, constraint_id: str, metrics: Dict[str, float]):
        """Core logic for P-M02 violation detection."""
        
        required_checks = self.acvm_config.get(constraint_id, {})
        
        if not required_checks:
            return

        for metric_key, constraints in required_checks.items():
            current_value = metrics.get(metric_key)

            if current_value is None:
                # Missing expected metric: Log but do not IH unless configured to do so.
                logger.warning(f"Metric '{metric_key}' expected for {constraint_id} not found in telemetry data.")
                continue

            min_threshold = constraints["min"]
            max_threshold = constraints["max"]
            
            if current_value < min_threshold or current_value > max_threshold:
                reason = (
                    f"P-M02 Violation detected by DMW (Stage Validation). "
                    f"Constraint: {constraint_id}. Metric '{metric_key}' value ({current_value}) "
                    f"outside bounds [{min_threshold}, {max_threshold}]."
                )
                self.trigger_halt(reason, metric_key, current_value, min_threshold, max_threshold)
                return # Fail-Fast: Terminate evaluation immediately upon first IH trigger

    def trigger_halt(self, reason: str, metric: str = 'N/A', actual: Any = 'N/A', min_b: Any = 'N/A', max_b: Any = 'N/A'):
        """
        Executes immediate Integrity Halt (IH), initiating P-R03 tracing procedures.
        """
        halt_details = {
            "policy": "P-M02",
            "reason": reason,
            "metric": metric,
            "actual_value": actual,
            "min_bound": min_b,
            "max_bound": max_b
        }
        
        logger.critical(f"INTEGRITY HALT (IH) TRIGGERED: {reason}", extra=halt_details)
        
        # Pass structured details to the manager for FDLS tracing and DIAL preparation
        self.dse_manager.initiate_integrity_halt(reason, details=halt_details)
