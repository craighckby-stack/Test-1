import json
import logging
import time
from collections import deque
from typing import Dict, Any, Deque

# --- Configuration: Daemon Parameters ---
class PolicyAdjustmentConfig:
    """Centralized configuration for the Oversight Learning Daemon (OLD)."""
    MAX_HISTORY_LENGTH = 100
    MIN_ANALYSIS_WINDOW = 50
    
    # Adaptive Threshold Management (ADTM) Target Thresholds
    ADTM_DEBT_THRESHOLD = 0.10      # If failure rate exceeds 10%, decrease policy threshold (Utility debt release)
    ADTM_STABILITY_TARGET = 0.02    # If failure rate below 2%, cautiously increase threshold (Optimization pressure)

    ADJUSTMENT_STEP = 0.005 # Magnitude of policy change
    TARGET_POLICY_KEY = "ACVD_TEMM_REQUIREMENT" # The governance metric being tuned
    POLICY_SERVER_ENDPOINT = './system/governance/PCS_policy_server.py' 
    SOURCE_DAEMON_ID = "GOV_OLD_V94.1"

# Assuming governance_transmitter is scaffolded/available (or MHVA integration occurs here)
try:
    from system.governance.governance_transmitter import transmit_governance_proposal
except ImportError:
    # Fallback for systems where scaffolding is not yet deployed
    def transmit_governance_proposal(proposal, target):
        logging.warning("Governance Transmitter missing. Proposal logged locally.")
        print(json.dumps(proposal, indent=2))
        return True

logging.basicConfig(level=logging.INFO, format='%(asctime)s - OLD_Daemon - %(levelname)s - %(message)s')

class OversightLearningDaemon:
    """OLD Daemon: Monitors State Transition Receipt (STR) outcomes, specifically focusing on 
    ADTM (Adaptive Threshold Management) failure rates, and recommends governance adjustments
    to ACVD policy thresholds to maintain optimal utility trade-off and system stability."""

    def __init__(self):
        self.recent_str_results: Deque[Dict[str, Any]] = deque(maxlen=PolicyAdjustmentConfig.MAX_HISTORY_LENGTH)
        self.current_adtm_failure_rate: float = 0.0
        self.logger = logging.getLogger('OLD_Daemon')
        self.logger.info(f"Initialized OLD Daemon with history length {PolicyAdjustmentConfig.MAX_HISTORY_LENGTH}.")


    def ingest_str(self, str_data: Dict[str, Any]):
        """Ingests State Transition Receipt data and updates performance metrics."""
        
        p01_pass = str_data.get('P_01_PASS', True)
        failure_flags = str_data.get('FAILURE_FLAGS', {})
        
        self.recent_str_results.append({
            'success': p01_pass,
            'adtm_failed': 'ADTM' in failure_flags
        })
        
        self._analyze_recent_performance()

    def _calculate_metrics(self) -> tuple[int, int, float]:
        """Calculates current metrics based on the rolling history."""
        total_attempts = len(self.recent_str_results)
        
        if total_attempts == 0:
            return 0, 0, 0.0
            
        # Efficient calculation across the small deque history
        adtm_failures = sum(1 for result in self.recent_str_results if result['adtm_failed'])
        current_rate = adtm_failures / total_attempts
        return total_attempts, adtm_failures, current_rate

    def _analyze_recent_performance(self):
        """Analyzes history and determines necessary adaptive governance interventions."""
        
        total, _, rate = self._calculate_metrics()
        self.current_adtm_failure_rate = rate

        if total < PolicyAdjustmentConfig.MIN_ANALYSIS_WINDOW: 
            return # Insufficient data confidence

        # 1. High Failure Condition: System stability is compromised by too high utility debt pressure.
        if rate > PolicyAdjustmentConfig.ADTM_DEBT_THRESHOLD:
            self.logger.warning(
                f"HIGH RATE: {rate:.3f}. System Debt Pressure too high. Proposing Policy Reduction ({PolicyAdjustmentConfig.TARGET_POLICY_KEY})."
            )
            self._propose_adjustment(
                direction='DECREASE',
                rationale=f"ADTM sustained denial rate ({rate:.3f}) exceeds high threshold ({PolicyAdjustmentConfig.ADTM_DEBT_THRESHOLD}). Reducing required cognitive utility vetting tolerance."
            )
            
        # 2. Low Failure/Stable Condition: Opportunity for optimization pressure increase.
        elif rate < PolicyAdjustmentConfig.ADTM_STABILITY_TARGET and total == PolicyAdjustmentConfig.MAX_HISTORY_LENGTH:
            # Only propose upward optimization when history queue is fully saturated (highest confidence).
            self.logger.info(
                f"LOW RATE: {rate:.3f}. System stable. Proposing Cautious Policy Increment ({PolicyAdjustmentConfig.TARGET_POLICY_KEY})."
            )
            self._propose_adjustment(
                direction='INCREASE',
                rationale=f"ADTM sustained acceptance rate ({rate:.3f}) below optimization floor ({PolicyAdjustmentConfig.ADTM_STABILITY_TARGET}). Incrementally raising cognitive utility requirement for optimization pressure."
            )

    def _propose_adjustment(self, direction: str, rationale: str):
        """Generates and transmits the governance adjustment proposal payload."""
        
        if direction == 'DECREASE':
            adjustment_value = -PolicyAdjustmentConfig.ADJUSTMENT_STEP 
        elif direction == 'INCREASE':
            adjustment_value = PolicyAdjustmentConfig.ADJUSTMENT_STEP 
        else:
            self.logger.error(f"Invalid proposal direction: {direction}")
            return

        proposal = {
            "GOVERNANCE_PROTOCOL": "ADAPTIVE_TUNING_P1",
            "TARGET_POLICY_METRIC": PolicyAdjustmentConfig.TARGET_POLICY_KEY,
            "DIRECTION": direction,
            "CHANGE_VALUE": adjustment_value, 
            "CURRENT_MONITOR_RATE": self.current_adtm_failure_rate,
            "RATIONALE": rationale,
            "SOURCE_DAEMON": PolicyAdjustmentConfig.SOURCE_DAEMON_ID,
            "TIMESTAMP": time.time(),
            "VERSION_EPOCH": "V94.1.ADAPTIVE_GOV"
        }

        # Use the secure transmitter (ideally routed through MHVA for stabilization)
        transmit_governance_proposal(proposal, PolicyAdjustmentConfig.POLICY_SERVER_ENDPOINT)

# --- Execution Simulation ---
if __name__ == '__main__':
    daemon = OversightLearningDaemon()
    
    # Phase 1: Warm Up
    print("\n--- SIMULATION PHASE 1: WARM UP (50 STRs) ---")
    for _ in range(50):
        daemon.ingest_str({'P_01_PASS': True, 'FAILURE_FLAGS': {}})
    
    # Phase 2: Simulate High Failure Rate (Should trigger DECREASE proposal)
    print("\n--- SIMULATION PHASE 2: HIGH ADTM RATE (Trigger DECREASE) ---")
    for i in range(50):
        is_failure = (i % 4 == 0) 
        flags = {'ADTM': 'UtilityDebt'} if is_failure else {}
        daemon.ingest_str({'P_01_PASS': not is_failure, 'FAILURE_FLAGS': flags})

    # Phase 3: Simulate Recovery and Optimization Pressure (100 steps of success) -> Triggers INCREASE proposal
    print("\n--- SIMULATION PHASE 3: LOW ADTM RATE (Trigger INCREASE) ---")
    for i in range(100):
        daemon.ingest_str({'P_01_PASS': True, 'FAILURE_FLAGS': {}})

    print(f"\nDaemon simulation finished. Final Rate: {daemon.current_adtm_failure_rate:.3f}")