import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, List

class ACVD_DecisionEngine:
    """Manages state transitions and validation enforcement based on the ACVD schema.

    The Decision Engine implements robust file and JSON error handling, 
    and now provides structured validation reports to facilitate AGI meta-reasoning 
    and detailed learning history capture.

    Improvements in Cycle 1: Enhanced structural validation checks and standardized 
    internal logging for improved Error Handling and Meta-Reasoning support.
    """

    DEFAULT_MIN_SAFETY_SCORE = 0.85
    
    def __init__(self, schema_path: str = 'governance/ACVD_schema.json'):
        self.schema_path = schema_path
        self.schema = self._load_schema(schema_path)
        
        self.valid_states = self.schema.get('valid_states', []) 
        self.safety_threshold = self.schema.get('config', {}).get(
            'min_safety_score', 
            self.DEFAULT_MIN_SAFETY_SCORE
        )
        
        if not self.valid_states:
            self._log_status(
                "WARNING", 
                "Schema initialized without defined states. Transitions may lack governance enforcement.", 
                "ACVD_INIT"
            )

    def _log_status(self, level: str, message: str, context: str):
        """Standardized internal logging mechanism for tracing initialization and runtime issues.
        (Placeholder for autonomous monitoring/telemetry infrastructure)
        """
        timestamp = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        print(f"[ACVD {level} | {context} @ {timestamp}] {message}")


    def _load_schema(self, path: str) -> Dict[str, Any]:
        """Loads and parses the ACVD schema file with robust error handling (JSON Parsing)."""
        
        if not os.path.exists(path):
            # Graceful failure recovery
            self._log_status("CRITICAL", f"ACVD Schema not found at {path}. Governance cannot proceed.", "SCHEMA_LOAD")
            raise FileNotFoundError(f"ACVD Schema not found at {path}. Governance cannot proceed.")
        
        try:
            with open(path, 'r') as f:
                content = f.read()
                if not content.strip():
                    self._log_status("ERROR", "ACVD Schema file is empty.", "SCHEMA_LOAD")
                    raise ValueError("ACVD Schema file is empty.")
                return json.loads(content)
        except json.JSONDecodeError as e:
            # Enhanced context reporting for JSON Parsing Robustness
            self._log_status("CRITICAL", f"Failed to parse ACVD Schema JSON at {path}. Malformed structure detected.", "JSON_PARSE_ERROR")
            raise ValueError(f"Failed to parse ACVD Schema JSON at {path}. Malformed structure detected: {e}")
        except Exception as e:
            self._log_status("CRITICAL", f"Unexpected error loading ACVD schema: {e}", "RUNTIME_ERROR")
            raise RuntimeError(f"Unexpected error loading ACVD schema: {e}")

    def validate_proposal(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Performs structural, state, and metric validation, returning a detailed report 
        for AGI meta-reasoning and learning history (Meta-Reasoning support).
        """
        report: Dict[str, Any] = {
            "status": "PASS",
            "issues": [],
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        }
        
        current_state = proposal.get('state')
        
        # 1. Basic State Recognition Check
        if self.valid_states and current_state not in self.valid_states and current_state != 'INITIAL_SUBMISSION':
            report['issues'].append({
                "type": "STATE_ERROR",
                "severity": "CRITICAL",
                "message": f"Proposal state '{current_state}' is not a recognized workflow state.",
                "context": f"Valid states: {', '.join(self.valid_states)}"
            })
            report['status'] = 'FAIL'

        # Optimization: Skip deep metrics checks unless explicitly PENDING_VALIDATION
        if current_state != 'PENDING_VALIDATION':
            return report
        
        # 2. Deep Metrics and Structural Checks (Enhanced Robustness)
        
        # Check for existence of critical validation structures
        if 'validationMetrics' not in proposal:
            report['issues'].append({"type": "STRUCTURAL_ERROR", "severity": "CRITICAL", "message": "Missing 'validationMetrics' key in proposal."})
            report['status'] = 'FAIL'

        if 'safetyAssessment' not in proposal:
            report['issues'].append({"type": "STRUCTURAL_ERROR", "severity": "CRITICAL", "message": "Missing 'safetyAssessment' key in proposal."})
            report['status'] = 'FAIL'

        # If structural integrity already failed, stop here.
        if report['status'] == 'FAIL':
            return report

        validation_metrics = proposal['validationMetrics'] 
        safety_assessment = proposal['safetyAssessment'] 
        
        # 2a. Regression Test Status
        if validation_metrics.get('regressionTestStatus') != 'PASS':
            report['issues'].append({
                "type": "METRIC_FAILURE",
                "severity": "CRITICAL",
                "message": "Proposal failed critical regression tests. Status: " + str(validation_metrics.get('regressionTestStatus')),
                "metric": "regressionTestStatus"
            })
            report['status'] = 'FAIL'

        # 2b. Safety Score Check
        safety_score = safety_assessment.get('confidenceScore', 0.0)
        
        if safety_score < self.safety_threshold:
            report['issues'].append({
                "type": "GOVERNANCE_VIOLATION",
                "severity": "CRITICAL",
                "message": f"Confidence score {safety_score:.2f} is below minimum threshold ({self.safety_threshold:.2f}).",
                "metric": "confidenceScore",
                "value": safety_score
            })
            report['status'] = 'FAIL'
            
        return report

    def transition_state(self, proposal: Dict[str, Any], new_state: str, decision_maker: str, reason: str, validation_report: Dict[str, Any] = None) -> Dict[str, Any]:
        """Records a state change in the decision history and updates the current state.
        
        Accepts an optional validation_report to enforce governance compliance before transition.
        """
        
        # 1. State Validity Check
        if self.valid_states and new_state not in self.valid_states:
             # Standard Error Handling: Explicit failure on invalid state transition
             raise ValueError(f"Invalid target state: {new_state}. Must be one of {', '.join(self.valid_states)}")
             
        # 2. Governance Enforcement based on Validation Report (if provided)
        if validation_report and new_state == 'APPROVED' and validation_report.get('status') == 'FAIL':
            # This demonstrates strategic integration and enforcement (Autonomy/Governance)
            first_issue_message = validation_report.get('issues', [{}])[0].get('message', 'Unknown failure.')
            raise PermissionError(f"Cannot transition to 'APPROVED'. Proposal validation failed: {first_issue_message}. Consult lastValidationReport for details.")
        
        new_entry = {
            "decisionMaker": decision_maker,
            "decisionType": "STATE_CHANGE",
            "reason": reason,
            "previousState": proposal.get('state', 'UNINITIALIZED'), # Capture previous state explicitly for better history/Meta-Reasoning
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        }
        
        # Ensure history structure exists
        if 'decisionHistory' not in proposal:
             proposal['decisionHistory'] = []
             
        # Record the transition
        proposal['state'] = new_state
        proposal['decisionHistory'].append(new_entry)
        
        # Optionally record the full validation report if transition was based on it
        if validation_report:
            proposal['lastValidationReport'] = validation_report
            
        return proposal