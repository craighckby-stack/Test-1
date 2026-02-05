# IH_Sentinel.py: Integrity Halt Sentinel Monitoring Layer

import logging
from typing import Dict, Any, List

# Dependencies from Calculus Engine and Governance Framework
from system.core.P01_calculus_engine import IntegrityHalt, RRPManager
from config.governance_policies import SENTINEL_CRITICAL_FLAGS  # New Policy Config
from config.governance_schema import TEDS_EVENT_CONTRACT

logging.basicConfig(level=logging.WARNING, format='[IHSentinel] %(levelname)s: %(message)s')

class IHSentinel:
    """Actively monitors the TEDS stream for contract deviations and pre-emptively
    triggers an Integrity Halt (IH) if axiomatic failure conditions (IH Flags) are detected.
    Optimizes failure detection latency and enforces TEDS schema strictness.
    """

    # Axiomatic flags loaded dynamically from configuration
    CRITICAL_FLAGS: List[str] = SENTINEL_CRITICAL_FLAGS

    def __init__(self):
        # Removed unused 'teds_stream_ref' to simplify interface.
        logging.info("IHSentinel initialized. Monitoring axiomatic flags.")

    def _check_teds_contract(self, event: Dict[str, Any]) -> bool:
        """Verify if the event adheres strictly to the mandatory TEDS_EVENT_CONTRACT.
        Uses fast-failure auditing.
        """
        required_keys = TEDS_EVENT_CONTRACT.get('mandatory_keys', [])

        for key in required_keys:
            if key not in event:
                error_msg = f"Schema Violation: Missing mandatory key '{key}'"
                logging.error(f"TEDS Contract Violation: {error_msg} in event: {event.get('stage', 'Unknown Stage')}")
                IntegrityHalt.trigger(error_msg)
                return False
        
        # Assuming a basic requirement for required critical attributes like 'stage' or 'flag_active'
        return True

    def monitor_stream(self, new_event: Dict[str, Any]) -> bool:
        """
        Ingest a new TEDS event. Performs synchronous, non-negotiable checks.
        Returns True if an IH was triggered, False otherwise.
        """
        if not new_event:
            return False

        # Phase 1: Contract Integrity Check (Auditability Tenet)
        if not self._check_teds_contract(new_event):
            RRPManager.initiate_rollback()  # Rollback initiated immediately upon contract failure
            return True

        # Phase 2: Critical Flag Axiomatic Check
        if new_event.get('flag_active'):
            flag_name = str(new_event['flag_active']).upper()
            
            if flag_name in self.CRITICAL_FLAGS:
                stage = new_event.get('stage', 'UNKNOWN')
                
                logging.critical(f"AXIOMATIC IH FLAG DETECTED: {flag_name} activated during stage {stage}. Initiating Halt.")
                IntegrityHalt.trigger(f"Immediate Termination via Axiomatic Flag {flag_name}")
                RRPManager.initiate_rollback()
                return True

        return False
