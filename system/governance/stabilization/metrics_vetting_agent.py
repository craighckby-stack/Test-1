Metrics and Health Vetting Agent (MHVA) v94.1

Purpose: Provides a stabilization layer for autonomous governance proposals. 
It ingests proposals from monitoring daemons (like OLD), applies temporal 
smoothing and directional persistence checks, and then forwards the 
validated/throttled proposal to the Policy Control Server (PCS).

Mechanism: Requires 'N' consecutive signals pointing in the same direction 
within a specific temporal window before escalating the proposal to the PCS.
This prevents noise and short-term volatility from inducing detrimental policy changes.

import json
import time
import logging
from typing import Dict, Any
from collections import deque

# Assume transmitter exists for PCS
try:
    from system.governance.governance_transmitter import transmit_governance_proposal
except ImportError:
    logging.error("Governance Transmitter required for MHVA operation.")
    def transmit_governance_proposal(proposal, target):
        logging.warning("MHVA failed transmission check.")
        return False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - MHVA - %(levelname)s - %(message)s')

class MHVAConfig:
    # Persistence Requirements
    REQUIRED_PERSISTENCE = 3 # N consecutive signals required
    SIGNAL_WINDOW_SECONDS = 300 # Signals must arrive within 5 minutes
    
    # Internal State Tracking
    MAX_HISTORY = 10

class MetricsVettingAgent:
    def __init__(self):
        # {metric_key: [{'direction': str, 'timestamp': float, 'proposal': Dict[str, Any]}, ...] 
        self.signal_history: Dict[str, deque[Dict[str, Any]]] = {}
        self.logger = logging.getLogger('MHVA')
        
    def _forward_proposal(self, proposal: Dict[str, Any], target_endpoint: str):
        """Forwards the successfully vetted proposal to the Policy Control Server (PCS)."""
        if target_endpoint:
            self.logger.info(f"Vetting successful. Forwarding proposal: {proposal['TARGET_POLICY_METRIC']} ({proposal['DIRECTION']})")
            return transmit_governance_proposal(proposal, target_endpoint)
        self.logger.error("Vetting successful, but target endpoint missing.")
        return False
        
    def ingest_proposal(self, proposal: Dict[str, Any]):
        """Ingests a raw proposal and applies stabilization vetting."""
        metric_key = proposal.get("TARGET_POLICY_METRIC")
        direction = proposal.get("DIRECTION")
        target_endpoint = proposal.get("TARGET_POLICY_SERVER")
        current_time = time.time()
        
        if not metric_key or not direction or not target_endpoint:
            self.logger.warning(f"Malformed proposal received (Missing key/direction/target). Skipping vetting: {proposal.get('SOURCE_DAEMON')}")
            return

        if metric_key not in self.signal_history:
            self.signal_history[metric_key] = deque(maxlen=MHVAConfig.MAX_HISTORY)
            
        # Record the incoming signal
        self.signal_history[metric_key].append({
            'direction': direction,
            'timestamp': current_time,
            'proposal': proposal 
        })

        # Check for Persistence
        history = self.signal_history[metric_key]
        
        # Filter for recent signals matching the current direction
        relevant_signals = [
            s for s in history 
            if s['direction'] == direction and (current_time - s['timestamp']) <= MHVAConfig.SIGNAL_WINDOW_SECONDS
        ]
        
        if len(relevant_signals) >= MHVAConfig.REQUIRED_PERSISTENCE:
            self.logger.critical(
                f"PERSISTENCE MET: {metric_key} has {len(relevant_signals)} recent '{direction}' signals. Triggering proposal."
            )
            # Use the latest received proposal payload (which already contains the target adjustments)
            latest_proposal = relevant_signals[-1]['proposal']
            
            # Reset stabilization counter by removing all signals matching this direction/time window
            self.signal_history[metric_key] = deque([
                s for s in history 
                if not (s['direction'] == direction and (current_time - s['timestamp']) <= MHVAConfig.SIGNAL_WINDOW_SECONDS)
            ], maxlen=MHVAConfig.MAX_HISTORY)
            
            self._forward_proposal(latest_proposal, target_endpoint)
            
        else:
            self.logger.debug(f"Persistence not met for {metric_key} ({len(relevant_signals)}/{MHVAConfig.REQUIRED_PERSISTENCE}). Holding signal.")

if __name__ == '__main__':
    # Simulation requires Governance Transmitter to be mocked or available.
    agent = MetricsVettingAgent()
    print("MHVA Initialization Check.")