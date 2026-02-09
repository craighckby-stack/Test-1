import json
import os
from datetime import datetime
from typing import Dict, Any

class ACVD_DecisionEngine:
    """Manages state transitions and validation enforcement based on the ACVD schema.

    The Decision Engine now implements robust file and JSON error handling 
    during schema initialization and uses the loaded schema to define valid states.
    """

    def __init__(self, schema_path='governance/ACVD_schema.json'):
        self.schema = self._load_schema(schema_path)
        # Assuming the schema defines valid states under a specific key, e.g., 'valid_states'
        self.valid_states = self.schema.get('valid_states', []) 
        if not self.valid_states:
            print("WARNING: ACVD Schema initialized without defined states. Transitions may fail.")

    def _load_schema(self, path):
        """Loads and parses the ACVD schema file with robust error handling.

        Raises FileNotFoundError if the path is invalid, and ValueError if JSON is malformed.
        """
        if not os.path.exists(path):
            # Implements error handling and dependency awareness (Autonomy/Error Handling)
            raise FileNotFoundError(f"ACVD Schema not found at {path}. Governance cannot proceed.")
        
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse ACVD Schema JSON at {path}: {e}")
        except Exception as e:
            raise RuntimeError(f"Unexpected error loading ACVD schema: {e}")

    def validate_proposal(self, proposal: Dict[str, Any]) -> bool:
        """Checks if the proposal conforms to the ACVD schema structure and passes basic metrics checks.

        Uses PermissionError for critical governance violations.
        """
        current_state = proposal.get('state')
        
        # Initial check to see if the state is recognized (if schema defines them)
        if self.valid_states and current_state not in self.valid_states and current_state != 'INITIAL_SUBMISSION':
             raise ValueError(f"Proposal state '{current_state}' is not a recognized workflow state.")

        # Only run deep metrics checks if the proposal is meant to be validated
        if current_state != 'PENDING_VALIDATION':
            return True
        
        validation_metrics = proposal.get('validationMetrics', {})
        
        if validation_metrics.get('regressionTestStatus') != 'PASS':
            raise PermissionError("Proposal failed critical regression tests required for advancement.")
        
        safety_score = proposal.get('safetyAssessment', {}).get('confidenceScore', 0)
        if safety_score < 0.85:
            raise PermissionError(f"Confidence score {safety_score:.2f} below minimum threshold (0.85).")
            
        return True

    def transition_state(self, proposal: Dict[str, Any], new_state: str, decision_maker: str, reason: str) -> Dict[str, Any]:
        """Records a state change in the decision history and updates the current state.
        
        Validation of the new state relies on the loaded schema configuration.
        """
        
        # Use self.valid_states derived from the actual schema load
        if self.valid_states and new_state not in self.valid_states:
             raise ValueError(f"Invalid target state: {new_state}. Must be one of {', '.join(self.valid_states)}")

        new_entry = {
            "decisionMaker": decision_maker,
            "decisionType": "STATE_CHANGE",
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
        
        proposal['state'] = new_state
        
        if 'decisionHistory' not in proposal:
             proposal['decisionHistory'] = []
             
        proposal['decisionHistory'].append(new_entry)
        return proposal

# Example Usage Stub:
# engine = ACVD_DecisionEngine()
# proposal_data = {"state": "PENDING_VALIDATION", "decisionHistory": [], "validationMetrics": {"regressionTestStatus": "PASS"}, "safetyAssessment": {"confidenceScore": 0.9}}
# approved_proposal = engine.transition_state(proposal_data, 'APPROVED', 'AGI/Sovereign', 'All metrics passed thresholds.')
