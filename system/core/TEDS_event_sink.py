import json
import time
from typing import Dict, Any, List, Optional

# NOTE: Architectural imports restored based on system requirements
from config.TEDS_event_contract import TEC_CONTRACT
from system.monitoring.IH_Sentinel import IntegritySentinel

# --- Custom Exceptions for Auditability ---
class TEDSContractViolation(Exception):
    """Base exception for TEDS compliance failures."""
    pass

class TEDSSequenceBreach(TEDSContractViolation):
    """Raised when the event stage sequence is violated."""
    pass

class TEDSDataIntegrityBreach(TEDSContractViolation):
    """Raised when the event payload lacks required keys or schema compliance."""
    pass

class TEDSEventSink:
    """
    Manages the sequential, immutable writing of events to the Trusted Event Data Stream (TEDS).
    Enforces compliance with the TEC (TEDS Event Contract) and signals the IntegritySentinel 
    upon detected violation.
    """
    
    # Explicitly define the dependency on the Integrity Halt system
    INTEGRITY_HALT_SIGNAL = IntegritySentinel.raise_integrity_halt
    
    def __init__(self, persistence_handler: Optional[List[Dict[str, Any]]] = None):
        """
        Initializes the sink. Persistence can be injected (e.g., file writer, DB connector).
        """
        self.log_stream: List[Dict[str, Any]] = persistence_handler if persistence_handler is not None else []
        # Resumes logging sequence if existing persistence handler is provided
        self.expected_sequence_id: int = len(self.log_stream)

    def _check_sequence(self, stage: str) -> None:
        """Internal check for strict sequential stage adherence. Raises TEDSSequenceBreach if violated."""
        try:
            expected_stage = TEC_CONTRACT["sequence"][self.expected_sequence_id]["stage"]
            if stage != expected_stage:
                raise TEDSSequenceBreach(
                    f"Expected stage '{expected_stage}' (Seq ID: {self.expected_sequence_id}), received '{stage}'."
                )
        except IndexError:
            raise TEDSSequenceBreach(
                f"TEDS sequence overflow. Attempted ID {self.expected_sequence_id}, contract length {len(TEC_CONTRACT['sequence'])}."
            )

    def _check_payload(self, event: Dict[str, Any]) -> None:
        """Internal check for required key presence in the event data. Raises TEDSDataIntegrityBreach."""
        required_keys = TEC_CONTRACT.get("required_keys", [])
        missing_keys = [key for key in required_keys if key not in event]
        
        if missing_keys:
            raise TEDSDataIntegrityBreach(
                f"Event missing required keys defined in TEC: {', '.join(missing_keys)}."
            )

    def validate_event(self, event_data: Dict[str, Any], stage_id: str) -> None:
        """
        Runs comprehensive validation checks. Raises TEDSContractViolation on failure.
        """
        self._check_sequence(stage_id)
        self._check_payload(event_data)
        
    def commit_event(self, event_data: Dict[str, Any], stage_id: str) -> bool:
        """Attempts to append a validated event to the immutable TEDS."""
        try:
            self.validate_event(event_data, stage_id)
            
            # --- Successful Commitment ---
            event_record = {
                "sequence_id": self.expected_sequence_id,
                "stage": stage_id,
                "commit_timestamp": time.time(), 
                "data": event_data
            }
            
            self.log_stream.append(event_record)
            self.expected_sequence_id += 1
            return True

        except TEDSContractViolation as e:
            # CRITICAL: Signal the halt system immediately upon contract violation
            details = {
                "sequence_id_attempted": self.expected_sequence_id,
                "stage_attempted": stage_id
            }
            
            self.INTEGRITY_HALT_SIGNAL(
                reason=f"TEDS_CONTRACT_BREACH: {type(e).__name__}",
                details=e.args[0], 
                context=details
            )
            return False

    def get_audit_trail(self) -> List[Dict[str, Any]]:
        """Returns the current state of the log stream (for inspection only)."""
        return self.log_stream
