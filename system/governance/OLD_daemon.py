import json
import logging
from collections import deque
from typing import Dict, Any

# Configuration parameters for adaptation
MAX_HISTORY_LENGTH = 100
ADTM_FAILURE_THRESHOLD = 0.10  # 10% of recent attempts failed utility check
ADJUSTMENT_INCREMENT = 0.005 # Small utility threshold adjustment factor

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

class OversightLearningDaemon:
    """OLD Daemon: Monitors STR failures, particularly ADTM events, 
    and recommends adjustments to ACVD policy thresholds for optimal system utility."""

    def __init__(self, policy_server_path: str = './system/governance/PCS_policy_server.py'):
        self.policy_server_path = policy_server_path
        self.recent_str_results = deque(maxlen=MAX_HISTORY_LENGTH)
        self.logger = logging.getLogger('OLD_Daemon')

    def ingest_str(self, str_data: Dict[str, Any]):
        """Ingests State Transition Receipt data, focusing on P-01 outcome and failure flags."""
        p01_result = str_data.get('P_01_PASS', False)
        failure_flags = str_data.get('FAILURE_FLAGS', {})
        
        self.recent_str_results.append({
            'success': p01_result,
            'adtm_failed': 'ADTM' in failure_flags
        })
        
        self._analyze_recent_performance()

    def _analyze_recent_performance(self):
        """Checks if the observed ADTM failure rate exceeds the dynamic threshold."""
        if len(self.recent_str_results) < 50: # Wait for enough data
            return
            
        adtm_failures = sum(1 for result in self.recent_str_results if result['adtm_failed'])
        total_attempts = len(self.recent_str_results)
        adtm_failure_rate = adtm_failures / total_attempts

        if adtm_failure_rate > ADTM_FAILURE_THRESHOLD:
            self.logger.warning(
                f"Observed ADTM Failure Rate ({adtm_failure_rate:.2f}) exceeds threshold ({ADTM_FAILURE_THRESHOLD})."
            )
            # ADTM failure means TEMM was sufficient, but ACVD threshold was too high.
            # We must propose a *reduction* in the ACVD TEMM requirement to allow more utility.
            self._propose_adjustment(direction='DECREASE', metric='TEMM_THRESHOLD')
        
        # Optional: Add logic for success streak analysis to cautiously re-increase threshold (optimization pressure)

    def _propose_adjustment(self, direction: str, metric: str):
        """Generates a dynamic governance adjustment proposal payload for PCS."""
        
        proposal = {
            "ADJUSTMENT_TYPE": "DYNAMIC_GOVERNANCE_TUNING",
            "METRIC": metric,
            "DIRECTION": direction,
            "VALUE": ADJUSTMENT_INCREMENT if direction == 'DECREASE' else -ADJUSTMENT_INCREMENT,
            "RATIONALE": f"High sustained ADTM failure rate requiring adaptation (rate: {self.adtm_failure_rate:.2f}).",
            "VERSION_EPOCH": "V94.1.ADAPTIVE"
        }

        self.logger.info(f"PROPOSAL GENERATED: {proposal['RATIONALE']}")
        # In a real implementation, this payload would be securely sent to the PCS for GAX vetting/approval
        # (e.g., PCS.receive_governance_proposal(proposal))

if __name__ == '__main__':
    # Simple simulation loop
    daemon = OversightLearningDaemon()
    # Simulate 60 successful STRs
    for i in range(55):
        daemon.ingest_str({'P_01_PASS': True, 'FAILURE_FLAGS': {}})
    
    # Simulate 40 ADTM failures (pushes rate over 40%)
    for i in range(40):
        daemon.ingest_str({'P_01_PASS': False, 'FAILURE_FLAGS': {'ADTM': 'UtilityDebt'}})
    
    daemon.ingest_str({'P_01_PASS': False, 'FAILURE_FLAGS': {'ADTM': 'UtilityDebt'}})

