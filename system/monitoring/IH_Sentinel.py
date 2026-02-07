# IH_Sentinel.py: Integrity Halt Sentinel Monitoring Layer

import logging
from typing import Dict, Any, List, Union, Type
from abc import ABC, abstractmethod
import json

# Dependencies from Calculus Engine and Governance Framework
from system.core.P01_calculus_engine import IntegrityHalt, RRPManager
# NOTE: TEDS_EVENT_CONTRACT is expected to contain 'mandatory_keys' and 'fields' definitions.
from config.governance_policies import SENTINEL_CRITICAL_FLAGS
from config.governance_schema import TEDS_EVENT_CONTRACT

logging.basicConfig(level=logging.INFO, format='[IHSentinel] %(levelname)s: %(message)s')

# Utility for type mapping. To be fully externalized in V95 architecture (see scaffold).
_TYPE_MAP: Dict[str, Union[Type, tuple]] = {
    'str': str, 'string': str,
    'int': int, 'integer': int,
    'float': float, 'number': (int, float), # Allows ints to pass float checks
    'bool': bool, 'boolean': bool,
    'dict': dict, 'object': dict,
    'list': list, 'array': list,
    'json': (dict, list, str), # Placeholder for required deep parsing check
}

class SentinelViolationError(Exception):
    """Custom exception raised when a non-negotiable TEDS contract or axiomatic
    flag failure occurs, requiring immediate Integrity Halt.
    
    Used for centralized error flow control within monitor_stream.
    """
    def __init__(self, message: str, severity: str = "CRITICAL"):
        super().__init__(message)
        self.severity = severity
        self.message = message

class TEDSContractAuditor(ABC):
    """Abstract Base Class for defining specialized TEDS validation handlers.
    Enables modular extension of contract enforcement (e.g., type checking, range checks).
    """
    @abstractmethod
    def audit(self, event: Dict[str, Any]):
        """Raises SentinelViolationError on failure, otherwise returns silently."""
        pass

class MandatoryKeyAuditor(TEDSContractAuditor):
    """Checks for the presence of all defined mandatory keys based on TEDS_EVENT_CONTRACT."""
    
    def __init__(self, contract: Dict[str, Any]):
        self.required_keys = contract.get('mandatory_keys', [])

    def audit(self, event: Dict[str, Any]):
        missing_keys = [key for key in self.required_keys if key not in event]
        
        if missing_keys:
            error_msg = f"Schema Violation: Missing mandatory keys: {missing_keys}"
            raise SentinelViolationError(error_msg, severity="SCHEMA_INTEGRITY_FAILURE")

class TypeAuditor(TEDSContractAuditor):
    """Checks data types against definitions provided in the TEDS contract schema (required V94.1 feature)."""
    
    def __init__(self, contract: Dict[str, Any]):
        self.field_definitions = contract.get('fields', {}) # Expects fields section

    def audit(self, event: Dict[str, Any]):
        for key, definition in self.field_definitions.items():
            expected_type_str = definition.get('type', 'str').lower()
            
            if key not in event: 
                # Key presence handled by MandatoryKeyAuditor
                continue 

            value = event[key]
            expected_type = _TYPE_MAP.get(expected_type_str)
            
            if expected_type is None:
                # Graceful handling of unknown types in config
                continue

            # Robust check for JSON type integrity (deep structure parsing check)
            if expected_type_str in ['dict', 'object'] and isinstance(value, str):
                try:
                    json.loads(value)
                except (TypeError, json.JSONDecodeError):
                    error_msg = (
                        f"Type Violation: Key '{key}' expected {expected_type_str} "
                        f"but received non-parseable JSON string."
                    )
                    raise SentinelViolationError(error_msg, severity="TYPE_MISMATCH_JSON")
            
            # General Type Check (Handles explicit type mismatch)
            if not isinstance(value, expected_type):
                error_msg = (
                    f"Type Violation: Key '{key}' expected {expected_type_str} "
                    f"but received type {type(value).__name__}"
                )
                raise SentinelViolationError(error_msg, severity="TYPE_MISMATCH")

# --- Primary Sentinel ---

class IHSentinel:
    """Actively monitors the TEDS stream for contract deviations and pre-emptively
    triggers an Integrity Halt (IH) if axiomatic failure conditions (IH Flags) are detected.
    """

    CRITICAL_FLAGS: List[str] = [flag.upper() for flag in SENTINEL_CRITICAL_FLAGS]
    
    def __init__(self):
        self.auditors: List[TEDSContractAuditor] = [
            MandatoryKeyAuditor(TEDS_EVENT_CONTRACT),
            TypeAuditor(TEDS_EVENT_CONTRACT), # Added TypeAuditor for robust data integrity
            # Future auditors (e.g., RangeAuditor) will be added here
        ]
        logging.info("IHSentinel initialized. Monitoring axiomatic flags and TEDS contract adherence.")

    def _execute_contract_audit(self, event: Dict[str, Any]):
        """Runs all defined auditors sequentially. Raises SentinelViolationError on first failure (fast-fail)."""
        for auditor in self.auditors:
            auditor.audit(event)

    def _check_critical_flags(self, event: Dict[str, Any]):
        """
        Phase 2: Critical Flag Axiomatic Check.
        Raises SentinelViolationError if a known critical flag is active.
        """
        flag_status = event.get('flag_active')
        
        if isinstance(flag_status, str):
            flag_name = flag_status.upper()
            
            if flag_name in self.CRITICAL_FLAGS:
                stage = event.get('stage', 'UNKNOWN')
                error_msg = f"AXIOMATIC IH FLAG DETECTED: {flag_name} activated during stage {stage}."
                raise SentinelViolationError(error_msg, severity="AXIOMATIC_FLAG_TRIGGER")

    def monitor_stream(self, new_event: Dict[str, Any]) -> bool:
        """
        Ingest a new TEDS event. Performs synchronous, non-negotiable checks.
        Returns True if an IH was triggered, False otherwise.
        """
        if not new_event:
            return False

        try:
            # Phase 1: Contract Integrity Check
            self._execute_contract_audit(new_event)

            # Phase 2: Critical Flag Check
            self._check_critical_flags(new_event)
            
            return False

        except SentinelViolationError as e:
            stage = new_event.get('stage', 'Unknown/Pre-Validation')
            halt_reason = f"[{e.severity}] {e.message}"
            
            logging.critical(
                f"Sentinel triggered Integrity Halt at Stage {stage}: {e.message}"
            )
            
            # Centralized Response Mechanism: Only one place initiates Halt and Rollback
            IntegrityHalt.trigger(halt_reason)
            RRPManager.initiate_rollback(reason=halt_reason) # Added reason traceability
            return True
