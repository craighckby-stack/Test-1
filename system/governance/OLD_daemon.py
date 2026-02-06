import json
import logging
from collections import deque
from typing import Dict, Any

# Assuming governance_transmitter is scaffolded/available
try:
    from system.governance.governance_transmitter import transmit_governance_proposal
except ImportError:
    # Fallback for systems where scaffold is not yet deployed
    def transmit_governance_proposal(proposal, target):
        logging.warning("Governance Transmitter missing. Proposal logged locally.")
        print(json.dumps(proposal, indent=2))
        return True

# --- Configuration: Monitoring Parameters ---
MAX_HISTORY_LENGTH = 100
MIN_ANALYSIS_WINDOW = 50 # Minimum number of STRs required before analysis
ADTM_FAILURE_THRESHOLD_HIGH = 0.10  # If failure rate exceeds 10%, decrease policy threshold (Utility debt is too high)
ADTM_FAILURE_THRESHOLD_LOW = 0.02   # If failure rate stays below 2%, cautiously increase policy threshold (Optimization pressure too low)

# --- Configuration: Adjustment Factors ---
ADJUSTMENT_STEP = 0.005 # Magnitude of change (e.g., utility threshold increase/decrease)
GOVERNANCE_METRIC_KEY = "ACVD_TEMM_REQUIREMENT" # The policy parameter being tuned (Adaptive Cognitive Vetting Daemon's TEMM threshold)
POLICY_SERVER_ENDPOINT = './system/governance/PCS_policy_server.py' # Placeholder target

logging.basicConfig(level=logging.INFO, format='%(asctime)s - OLD_Daemon - %(levelname)s - %(message)s')

class OversightLearningDaemon:
    """OLD Daemon: Monitors State Transition Receipt (STR) outcomes, specifically focusing on 
    ADTM (Adaptive Threshold Management) failure rates, and recommends governance adjustments
    to ACVD policy thresholds to maintain optimal utility trade-off and system stability."""

    def __init__(self):
        self.recent_str_results = deque(maxlen=MAX_HISTORY_LENGTH)
        self.current_adtm_failure_rate: float = 0.0
        self.logger = logging.getLogger('OLD_Daemon')

    def ingest_str(self, str_data: Dict[str, Any]):
        """Ingests State Transition Receipt data and updates performance metrics."""
        
        p01_pass = str_data.get('P_01_PASS', True)
        failure_flags = str_data.get('FAILURE_FLAGS', {})
        
        self.recent_str_results.append({
            'success': p01_pass,
            'adtm_failed': 'ADTM' in failure_flags
        })
        
        self._analyze_recent_performance()

    def _analyze_recent_performance(self):
        """Analyzes recent history against high and low adaptive thresholds, triggering governance proposals."""
        total_attempts = len(self.recent_str_results)
        
        if total_attempts < MIN_ANALYSIS_WINDOW: 
            return # Insufficient data for stable governance decision

        adtm_failures = sum(1 for result in self.recent_str_results if result['adtm_failed'])
        self.current_adtm_failure_rate = adtm_failures / total_attempts
        rate = self.current_adtm_failure_rate

        if rate > ADTM_FAILURE_THRESHOLD_HIGH:
            # High failure rate -> ACVD is too restrictive. Decrease threshold.
            self.logger.warning(
                f"Rate high ({rate:.3f} > {ADTM_FAILURE_THRESHOLD_HIGH:.3f}). Proposing DECREASE in {GOVERNANCE_METRIC_KEY}."
            )
            self._propose_adjustment(
                direction='DECREASE',
                rationale=f"Sustained high ADTM denial rate ({rate:.3f}). Lowering required utility to release debt."
            )
            
        elif rate < ADTM_FAILURE_THRESHOLD_LOW and total_attempts == MAX_HISTORY_LENGTH:
            # Low failure rate -> System is stable but perhaps under-optimized. Increase threshold (optimization pressure).
            self.logger.info(
                f"Rate low ({rate:.3f} < {ADTM_FAILURE_THRESHOLD_LOW:.3f}). Proposing CAUTIOUS INCREASE in {GOVERNANCE_METRIC_KEY}."
            )
            self._propose_adjustment(
                direction='INCREASE',
                rationale=f"Sustained low ADTM denial rate ({rate:.3f}). Incrementally raising utility requirement for optimization pressure."
            )

    def _propose_adjustment(self, direction: str, rationale: str):
        """Generates and transmits the governance adjustment proposal payload."""
        
        if direction == 'DECREASE':
            adjustment_value = -ADJUSTMENT_STEP 
        elif direction == 'INCREASE':
            adjustment_value = ADJUSTMENT_STEP 
        else:
            self.logger.error(f"Invalid direction: {direction}")
            return

        proposal = {
            "ADJUSTMENT_TYPE": "DYNAMIC_GOVERNANCE_TUNING",
            "TARGET_POLICY_METRIC": GOVERNANCE_METRIC_KEY,
            "DIRECTION": direction,
            "CHANGE_VALUE": adjustment_value, 
            "CURRENT_MONITOR_RATE": self.current_adtm_failure_rate,
            "RATIONALE": rationale,
            "SOURCE_DAEMON": "OLD_Daemon",
            "VERSION_EPOCH": "V94.1.ADAPTIVE"
        }

        # Use the secure transmitter to send the proposal for PCS vetting
        transmit_governance_proposal(proposal, POLICY_SERVER_ENDPOINT)

# --- Execution Simulation ---
if __name__ == '__main__':
    daemon = OversightLearningDaemon()
    
    # Phase 1: Warm Up
    for _ in range(50):
        daemon.ingest_str({'P_01_PASS': True, 'FAILURE_FLAGS': {}})
    
    # Phase 2: Simulate High Failure Rate (30% total rate) -> Triggers DECREASE proposal
    print("\n--- SIMULATION PHASE: HIGH ADTM RATE (Should trigger DECREASE) ---")
    for i in range(50):
        is_failure = (i % 4 == 0) # 12 failures total, 12+0 successes from P1 = 12/100 -> 0.12 (Exceeds 0.10)
        daemon.ingest_str({'P_01_PASS': not is_failure, 'FAILURE_FLAGS': {'ADTM': 'UtilityDebt'} if is_failure else {}})

    # Phase 3: Simulate Recovery and Optimization Pressure (100 steps of success) -> Triggers INCREASE proposal
    print("\n--- SIMULATION PHASE: LOW ADTM RATE (Should trigger INCREASE) ---")
    for i in range(100):
        daemon.ingest_str({'P_01_PASS': True, 'FAILURE_FLAGS': {}})

    print(f"\nDaemon simulation finished. Final Rate: {daemon.current_adtm_failure_rate:.3f}")
