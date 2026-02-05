# service/dse_metric_watchdog.py
import json
# Assuming a DSE Manager interface exists for system control
from governance.core_system import DSE_Manager 

class DSEMetricWatchdog:
    """
    Active agent responsible for real-time monitoring of GAX artifact telemetry 
    against predefined ACVM thresholds (P-M02). Triggers immediate Integrity Halt (IH)
    upon detection of threshold drift outside acceptable bounds between stages S01 and S08.
    """
    def __init__(self, acvm_path='config/acvm.json'):
        # ACVM structure is critical for defining operational minimums (GAX I, II, III)
        try:
            with open(acvm_path, 'r') as f:
                self.acvm_config = json.load(f)
        except FileNotFoundError:
            # IH triggered if ACVM config is missing/unreadable (P-M02 dependency failure)
            raise Exception("Critical DSE Dependency Failure: ACVM Configuration not found.")

        self.dse_manager = DSE_Manager()

    def ingest_telemetry(self, source_actor: str, artifact_name: str, metrics: dict):
        """ Ingests metrics and immediately evaluates them against ACVM thresholds. """
        constraint_id = self._map_artifact_to_constraint(artifact_name)
        if constraint_id:
            self._evaluate_constraints(constraint_id, metrics)

    def _map_artifact_to_constraint(self, artifact_name: str) -> str or None:
        mapping = {
            "CSR Snapshot": "GAX III",
            "ECVM Snapshot": "GAX II",
            "TEMM Snapshot": "GAX I" 
        }
        return mapping.get(artifact_name)

    def _evaluate_constraints(self, constraint_id: str, metrics: dict):
        required_checks = self.acvm_config.get(constraint_id, {})

        for metric_key, thresholds in required_checks.items():
            current_value = metrics.get(metric_key)

            if current_value is None:
                # Missing expected metric is itself a potential GAX III violation
                continue

            min_threshold = thresholds.get("min", float('-inf'))
            max_threshold = thresholds.get("max", float('inf'))

            if current_value < min_threshold or current_value > max_threshold:
                reason = (
                    f"P-M02 Violation detected by DMW during artifact generation. "
                    f"Constraint: {constraint_id}. Metric '{metric_key}' value ({current_value}) "
                    f"outside bounds [{min_threshold}, {max_threshold}]."
                )
                self.trigger_halt(reason)
                return

    def trigger_halt(self, reason: str):
        print(f"[DSE Metric Watchdog] INTEGRITY HALT (IH) TRIGGERED: {reason}")
        # Initiates P-R03 (FDLS tracing and DIAL preparation)
        self.dse_manager.initiate_integrity_halt(reason)
