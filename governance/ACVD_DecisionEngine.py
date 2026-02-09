import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, List

def get_utc_timestamp() -> str:
    """Returns the current UTC timestamp formatted consistently for system logging."""
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

class ACVD_DecisionEngine:
    """Manages state transitions and validation enforcement based on the ACVD schema.

    This version (v7.4.7 enhancement) introduces autonomous internal self-assessment 
    by calculating an 'Operational Integrity Score' based on the accumulation of 
    its own internal log queue errors, leveraging the dynamic governance weights. 
    This significantly boosts Autonomy, Error Handling, and Meta-Reasoning capabilities.
    
    Improvements in Cycle 3 (v7.4.5): Implemented dynamic, weighted scoring system for Governance Health Score 
    and added log flushing capabilities for Telemetry integration.
    
    Improvements in Cycle 4 (v7.4.6): Introduced `update_severity_weights` for autonomous governance optimization 
    (Meta-Reasoning, Autonomy). Severity weights are now dynamically loaded from the schema config 
    if available, ensuring configurability and adaptability.
    
    Improvements in Cycle 5 (v7.4.7): Implemented `perform_self_assessment` for internal monitoring and
    Operational Integrity Scoring, enhancing self-governance and Error Handling robustness.
    """

    DEFAULT_MIN_SAFETY_SCORE = 0.85
    DEFAULT_FALLBACK_WEIGHT = 0.30 # Used if an issue type is not defined in self.severity_weights
    
    # Base weights, used if no configuration is found in the schema (static reference)
    _BASE_SEVERITY_WEIGHTS = {
        "CRITICAL": 0.40, 
        "STRUCTURAL_ERROR": 0.50, 
        "GOVERNANCE_VIOLATION": 0.45,
        "METRIC_FAILURE": 0.35,
        "DATA_TYPE_ERROR": 0.30,
        "STATE_ERROR": 0.40
    }
    
    def __init__(self, schema_path: str = 'governance/ACVD_schema.json'):
        self.schema_path = schema_path
        self._log_queue: List[Dict[str, Any]] = [] # Infrastructure: Internal queue for Telemetry System
        
        try:
            self.schema = self._load_schema(schema_path)
        except Exception:
            # If schema loading fails critically, initialize with minimal safe defaults
            # Ensure the engine remains operational for core functions even without full governance
            self.schema = {} 
            self._log_status("CRITICAL", "Failed to load governance schema. Operating in limited mode.", "INIT_FAILSAFE")
            
        self.valid_states = self.schema.get('valid_states', []) 
        
        # Load configurable thresholds
        config = self.schema.get('config', {})
        
        self.safety_threshold = config.get(
            'min_safety_score', 
            self.DEFAULT_MIN_SAFETY_SCORE
        )
        
        # Load severity weights dynamically (supports Meta-Reasoning/Autonomy)
        self.severity_weights = config.get(
            'severity_weights',
            self._BASE_SEVERITY_WEIGHTS
        )
        
        if not self.valid_states:
            self._log_status(
                "WARNING", 
                "Schema initialized without defined states. Transitions may lack governance enforcement.", 
                "ACVD_INIT"
            )
        
        if self.safety_threshold == self.DEFAULT_MIN_SAFETY_SCORE and 'min_safety_score' not in config.keys():
             self._log_status(
                "INFO", 
                f"Using default safety score threshold: {self.DEFAULT_MIN_SAFETY_SCORE}", 
                "CONFIG_DEFAULT"
            )


    def _log_status(self, level: str, message: str, context: str):
        """Standardized internal logging mechanism, queueing structured logs for Telemetry System integration.
        (Supports Autonomous Directives for Monitoring and Telemetry Systems)
        """
        log_entry = {
            "timestamp": get_utc_timestamp(),
            "level": level,
            "message": message,
            "context": context
        }
        self._log_queue.append(log_entry)
        # Immediate console feedback for critical/error logs
        if level in ["CRITICAL", "ERROR", "WARNING"]:
            print(f"[ACVD {level} | {context} @ {log_entry['timestamp']}] {message}")

    def _load_schema(self, path: str) -> Dict[str, Any]:
        """Loads and parses the ACVD schema file with robust error handling (JSON Parsing)."""
        
        if not os.path.exists(path):
            self._log_status("CRITICAL", f"ACVD Schema not found at {path}. Governance cannot proceed.", "SCHEMA_LOAD")
            # We raise here because the failure needs to be caught in __init__ for fail-safe mode.
            raise FileNotFoundError(f"ACVD Schema not found at {path}.")
        
        try:
            with open(path, 'r') as f:
                content = f.read()
                if not content.strip():
                    self._log_status("ERROR", "ACVD Schema file is empty.", "SCHEMA_LOAD")
                    raise ValueError("ACVD Schema file is empty.")
                # JSON Parsing robustness enhancement: logs context on failure.
                return json.loads(content)
        except json.JSONDecodeError as e:
            # Enhanced context reporting for JSON Parsing Robustness
            self._log_status("CRITICAL", f"Failed to parse ACVD Schema JSON at {path}. Malformed structure detected.", "JSON_PARSE_ERROR")
            raise ValueError(f"Failed to parse ACVD Schema JSON at {path}. Malformed structure detected: {e}")
        except Exception as e:
            self._log_status("CRITICAL", f"Unexpected error loading ACVD schema: {e}", "RUNTIME_ERROR")
            raise RuntimeError(f"Unexpected error loading ACVD schema: {e}")
            
    def perform_self_assessment(self) -> Dict[str, Any]:
        """
        Calculates the internal Operational Integrity Score based on accumulated internal logs 
        since the last flush, leveraging governance severity weights.
        (Supports Autonomy and Monitoring Infrastructure for internal health checks.)
        """
        assessment = {
            "operationalIntegrityScore": 1.0,
            "criticalLogCount": 0,
            "errorLogCount": 0,
            "totalLogCount": len(self._log_queue),
            "weightedPenalty": 0.0,
            "timestamp": get_utc_timestamp()
        }

        # Map internal log levels to defined issue types for weight application
        # This allows the AGI kernel to use the same meta-reasoning weights for self-governance.
        LOG_LEVEL_MAP = {
            "CRITICAL": "CRITICAL",
            "ERROR": "STRUCTURAL_ERROR", 
            "WARNING": "GOVERNANCE_VIOLATION" 
        }
        
        negative_score_accumulation = 0.0
        
        for log in self._log_queue:
            level = log.get('level')
            
            if level == 'CRITICAL':
                assessment['criticalLogCount'] += 1
            elif level == 'ERROR':
                assessment['errorLogCount'] += 1

            # Apply penalty based on the log level severity
            if level in LOG_LEVEL_MAP:
                issue_type = LOG_LEVEL_MAP[level]
                # Internal issues are penalized slightly less severely than external proposal failures, 
                # but still critically, to allow for graceful recovery.
                weight = self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT * 0.5) 
                negative_score_accumulation += weight

        assessment['weightedPenalty'] = negative_score_accumulation
        assessment['operationalIntegrityScore'] = max(0.0, 1.0 - negative_score_accumulation)
        
        if assessment['operationalIntegrityScore'] < self.safety_threshold:
            self._log_status("WARNING", 
                             f"Operational Integrity Score ({assessment['operationalIntegrityScore']:.2f}) is below Safety Threshold ({self.safety_threshold:.2f}). Requires immediate attention.", 
                             "INTEGRITY_ALERT")
            
        return assessment


    def get_logs(self) -> List[Dict[str, Any]]:
        """Provides access to a copy of the internal log queue for external monitoring systems."""
        return self._log_queue[:] # Return a copy
        
    def flush_logs(self):
        """Clears the internal log queue after logs have been successfully consumed by the Telemetry System.
        (Supports Infrastructure Authority: Monitoring and Telemetry Systems)
        """
        if self._log_queue:
            self._log_queue.clear()
            self._log_status("DEBUG", "Internal log queue flushed.", "LOG_FLUSH")

    def update_severity_weights(self, new_weights: Dict[str, float]):
        """Allows Meta-Reasoning component to dynamically update governance scoring strategy 
        based on learning outcomes. (Supports Autonomy and Meta-Reasoning).
        """
        if not isinstance(new_weights, dict):
            self._log_status("ERROR", "Cannot update weights: Input must be a dictionary.", "WEIGHT_UPDATE_FAIL")
            return
            
        # Merge new weights, allowing updates or additions
        updates_applied = 0
        for key, value in new_weights.items():
            # Validate input value is a sensible float/int between 0.0 and 1.0
            if isinstance(value, (int, float)) and 0.0 <= value <= 1.0:
                self.severity_weights[key] = float(value)
                updates_applied += 1
            else:
                self._log_status("WARNING", f"Skipping invalid weight '{key}': value {value} must be float/int between 0.0 and 1.0.", "WEIGHT_UPDATE_SKIP")
        
        if updates_applied > 0:
            self._log_status("INFO", f"Severity weights dynamically updated. {updates_applied} entries changed.", "WEIGHT_UPDATE_SUCCESS")
        else:
            self._log_status("DEBUG", "Severity weights update called, but no valid changes were applied.", "WEIGHT_UPDATE_NOOP")


    def validate_proposal(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Performs structural, state, and metric validation, returning a detailed report 
        for AGI meta-reasoning and learning history (Meta-Reasoning support).
        
        The governanceHealthScore is calculated dynamically based on accumulated severity weights.
        """
        report: Dict[str, Any] = {
            "status": "PASS",
            "issues": [],
            "timestamp": get_utc_timestamp(),
            "governanceHealthScore": 1.0 # Initial score (1.0 = perfect compliance)
        }
        
        negative_score_accumulation = 0.0
        
        # Robustness check on input type
        if not isinstance(proposal, dict):
            # This is a total failure, instant score reduction
            issue_type = "STRUCTURAL_ERROR"
            report['issues'].append({"type": issue_type, "severity": "CRITICAL", "message": "Input proposal is not a valid dictionary.", "context": "Input Type"})
            report['status'] = 'FAIL'
            # Use consistent fallback weight if issue type isn't defined
            negative_score_accumulation += self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)
            report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)
            return report
            
        current_state = proposal.get('state')
        
        # 1. Basic State Recognition Check
        if self.valid_states and current_state not in self.valid_states and current_state != 'INITIAL_SUBMISSION':
            issue_type = "STATE_ERROR"
            report['issues'].append({
                "type": issue_type,
                "severity": "CRITICAL",
                "message": f"Proposal state '{current_state}' is not a recognized workflow state.",
                "context": f"Valid states: {', '.join(self.valid_states)}"
            })
            report['status'] = 'FAIL'
            negative_score_accumulation += self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)

        # Optimization: Skip deep metrics checks unless explicitly PENDING_VALIDATION
        if current_state != 'PENDING_VALIDATION' and report['status'] != 'FAIL':
            report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)
            return report
        
        # 2. Deep Metrics and Structural Checks (Enhanced Robustness & Meta-Reasoning)
        
        validation_metrics = proposal.get('validationMetrics')
        safety_assessment = proposal.get('safetyAssessment')
        
        # 2a. Check for existence and type of critical validation structures
        if not isinstance(validation_metrics, dict):
            issue_type = "STRUCTURAL_ERROR"
            report['issues'].append({"type": issue_type, "severity": "CRITICAL", "message": "Missing or malformed 'validationMetrics' key/structure in proposal."})
            report['status'] = 'FAIL'
            negative_score_accumulation += self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)

        if not isinstance(safety_assessment, dict):
            issue_type = "STRUCTURAL_ERROR"
            report['issues'].append({"type": issue_type, "severity": "CRITICAL", "message": "Missing or malformed 'safetyAssessment' key/structure in proposal."})
            report['status'] = 'FAIL'
            negative_score_accumulation += self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)

        # Early calculation if structural errors prevent reliable metric checking
        if report['status'] == 'FAIL':
             report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)

        # 2b. Regression Test Status Check (Defensive extraction)
        test_status = validation_metrics.get('regressionTestStatus') if isinstance(validation_metrics, dict) else None
        
        if test_status != 'PASS':
            issue_type = "METRIC_FAILURE"
            if test_status is None:
                message = "Missing 'regressionTestStatus' key. Assuming failure for governance compliance."
            else:
                message = f"Proposal failed critical regression tests. Status: {test_status}"
                
            report['issues'].append({
                "type": issue_type,
                "severity": "CRITICAL",
                "message": message,
                "metric": "regressionTestStatus"
            })
            report['status'] = 'FAIL'
            negative_score_accumulation += self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)

        # 2c. Safety Score Check (Defensive extraction and Type checking)
        safety_score = None
        
        if isinstance(safety_assessment, dict):
            raw_score = safety_assessment.get('confidenceScore')
            
            # Defensive extraction using try/except (Error Handling, JSON Parsing Robustness)
            try:
                safety_score = float(raw_score)
            except (ValueError, TypeError):
                safety_score = 0.0
                issue_type = "DATA_TYPE_ERROR"
                if raw_score is None:
                    msg = "Missing 'confidenceScore'. Defaulting score to 0.0."
                else:
                    msg = f"confidenceScore '{raw_score}' is not a valid number. Defaulting score to 0.0."
                    
                report['issues'].append({
                    "type": issue_type,
                    "severity": "CRITICAL",
                    "message": msg,
                    "metric": "confidenceScore",
                })
                report['status'] = 'FAIL'
                negative_score_accumulation += self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)
        
        if safety_score is not None and safety_score < self.safety_threshold:
            issue_type = "GOVERNANCE_VIOLATION"
            report['issues'].append({
                "type": issue_type,
                "severity": "CRITICAL",
                "message": f"Confidence score {safety_score:.2f} is below minimum threshold ({self.safety_threshold:.2f}).",
                "metric": "confidenceScore",
                "value": safety_score
            })
            report['status'] = 'FAIL'
            negative_score_accumulation += self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)
        
        # 3. Calculate Governance Health Score (Supports Meta-Reasoning/Strategic Decision-making)
        report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)

        return report

    def transition_state(self, proposal: Dict[str, Any], new_state: str, decision_maker: str, reason: str, validation_report: Dict[str, Any] = None) -> Dict[str, Any]:
        """Records a state change in the decision history and updates the current state.
        
        Enforces governance compliance before transition, and includes robust input checks (Error Handling).
        """
        
        # Robustness: Check input types
        if not isinstance(proposal, dict):
            self._log_status("ERROR", "Transition failed: Proposal input is not a dictionary.", "TRANSITION_INPUT_FAIL")
            raise TypeError("Proposal must be a dictionary.")

        if not isinstance(new_state, str) or not new_state:
            self._log_status("ERROR", "Transition failed: New state is invalid.", "TRANSITION_INPUT_FAIL")
            raise ValueError("Target state must be a non-empty string.")
            
        # 1. State Validity Check
        if self.valid_states and new_state not in self.valid_states:
             self._log_status("ERROR", f"Invalid target state attempted: {new_state}", "TRANSITION_GOVERNANCE")
             raise ValueError(f"Invalid target state: {new_state}. Must be one of {', '.join(self.valid_states)}")
             
        # 2. Governance Enforcement based on Validation Report (if provided)
        if validation_report and new_state == 'APPROVED':
            if not isinstance(validation_report, dict):
                 self._log_status("ERROR", "Validation report is not a dictionary, cannot proceed with approval.", "TRANSITION_GOVERNANCE")
                 raise TypeError("Validation report must be a dictionary if provided.")
                 
            if validation_report.get('status') == 'FAIL':
                # Autonomy/Governance enforcement
                first_issue_message = validation_report.get('issues', [{}])[0].get('message', 'Unknown failure.')
                self._log_status("CRITICAL", f"Approval blocked due to validation failure: {first_issue_message}", "GOVERNANCE_BLOCK")
                raise PermissionError(f"Cannot transition to 'APPROVED'. Proposal validation failed: {first_issue_message}. Consult lastValidationReport for details.")
        
        new_entry = {
            "decisionMaker": decision_maker,
            "decisionType": "STATE_CHANGE",
            "reason": reason,
            "previousState": proposal.get('state', 'UNINITIALIZED'), 
            "timestamp": get_utc_timestamp()
        }
        
        # Ensure history structure exists and is the correct type (list)
        if 'decisionHistory' not in proposal or not isinstance(proposal['decisionHistory'], list):
             proposal['decisionHistory'] = []
             self._log_status("WARNING", "Decision history initialized or repaired.", "HISTORY_REPAIR")
             
        # Record the transition
        proposal['state'] = new_state
        proposal['decisionHistory'].append(new_entry)
        
        # Optionally record the full validation report if transition was based on it
        if validation_report:
            proposal['lastValidationReport'] = validation_report
            
        self._log_status("INFO", f"State transitioned from {new_entry['previousState']} to {new_state} by {decision_maker}.", "TRANSITION_SUCCESS")

        return proposal
