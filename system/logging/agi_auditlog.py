# AGI_AuditLog: Sovereign AGI V94.1 Tamper-Resistant Logging and Auditing
# Mandate: Provide secure, structured, and optionally signed logging channels for critical system components (like EPRU).

import json
import datetime
import threading
import sys  # Necessary for robust critical failure logging to stderr
from typing import Dict, Any, Optional
# from system.security.log_signer import LogSigner # Hook for proposed security utility

AUDIT_LOG_FILE = 'system/audit/core_log.jsonl'

class AGI_AuditLog:
    def __init__(self, component_name: str = "CORE"):
        self.component_name = component_name
        self._lock = threading.Lock()
        # Future: self.signer = LogSigner.get_instance()

    @staticmethod
    def _create_log_entry(level: str, component: str, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a standardized, time-stamped log entry."""
        return {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "level": level,
            "component": component,
            "message": message,
            "context": context
        }

    def _sign_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        [MANDATE HOOK] Applies cryptographic signing metadata to the entry.
        Requires the LogSigner component for full functionality.
        """
        # Placeholder implementation for integrity check readiness
        entry['signing_metadata'] = {
            'status': 'UNSIGNED_V94',
            'hash_type': None
        }
        # FUTURE: return self.signer.sign(entry)
        return entry

    def _write_entry(self, level: str, message: str, context: Dict[str, Any] = {}) -> None:
        raw_entry = self._create_log_entry(level, self.component_name, message, context)
        
        # Step 1: Apply security/tamper-resistance checks (signing)
        signed_entry = self._sign_entry(raw_entry)
        
        # Step 2: Serialize and securely write to JSONL file
        serialized_entry = json.dumps(signed_entry) + '\n'
        
        with self._lock:
            try:
                # Open using 'a' (append) and specify encoding for robustness
                with open(AUDIT_LOG_FILE, 'a', encoding='utf-8') as f:
                    f.write(serialized_entry)
            except IOError as e:
                # Critical failure: Disk or Permissions failure. Fall back to stderr.
                print(f"[FATAL LOG WRITE FAILURE] Component={self.component_name}, Level={level} | Persistence Error: {e}", file=sys.stderr)
            except Exception as e:
                # General serialization/unknown error
                 print(f"[FATAL LOG WRITE FAILURE] Component={self.component_name}, Level={level} | Unexpected Error: {e}", file=sys.stderr)

    def info(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._write_entry("INFO", message, context)

    def warning(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._write_entry("WARNING", message, context)

    def error(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._write_entry("ERROR", message, context)

    def critical(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._write_entry("CRITICAL", message, context)

    def audit(self, message: str, context: Dict[str, Any] = {}) -> None:
        # The audit channel must be used for forensic events (like EPRU ingestion).
        self._write_entry("AUDIT", message, context)
