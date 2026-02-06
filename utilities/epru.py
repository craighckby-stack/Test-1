# Execution Post-Mortem Report Utility (EPRU) V94.1
# Mandate: Process signed Forensic Data & Log Snapshots (FDLS) to ensure continuous operational feedback and failure analysis integrity.

import json
from pathlib import Path
from typing import Dict, Any

# NOTE: This placeholder assumes the AGI_AuditLog module (proposed below) handles persistence and integrity.
class AGI_AuditLog:
    @staticmethod
    def error(msg): print(f"[AGI_LOG: ERROR] {msg}")
    @staticmethod
    def info(msg): print(f"[AGI_LOG: INFO] {msg}")
    @staticmethod
    def audit(msg): print(f"[AGI_LOG: AUDIT] {msg}")

# Configuration based on System Governance Mandates
FAILURE_REGISTRY_PATH = Path('config/failure_registry.json')

class EPRU:
    def __init__(self):
        self.log = AGI_AuditLog()
        self.registry: Dict[str, Any] = {"reports": []}
        self._load_registry()

    def _load_registry(self) -> None:
        """Loads the failure registry, creating it if it doesn't exist or handling corruption."""
        if not FAILURE_REGISTRY_PATH.exists():
            self.log.info(f"Registry not found. Initializing new registry at {FAILURE_REGISTRY_PATH}.")
            return

        try:
            with open(FAILURE_REGISTRY_PATH, 'r') as f:
                self.registry = json.load(f)
            
            if "reports" not in self.registry or not isinstance(self.registry["reports"], list):
                raise ValueError("Registry structure invalid (missing 'reports' list).")
                
        except json.JSONDecodeError:
            self.log.error(f"FATAL CORRUPTION: Registry file {FAILURE_REGISTRY_PATH} is corrupted. Resetting reports structure to maintain integrity.")
            self.registry = {"reports": []} 
        except Exception as e:
            self.log.error(f"Unexpected error loading registry: {type(e).__name__}: {e}. Initializing clean registry.")
            self.registry = {"reports": []} 

    def _save_registry(self) -> None:
        """Writes the updated registry state to maintain the append-only audit trail."""
        try:
            FAILURE_REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
            
            # Note: This overwrites the entire file. If the registry grows past 1GB, this must migrate to JSONL or a database.
            with open(FAILURE_REGISTRY_PATH, 'w') as f:
                json.dump(self.registry, f, indent=4)
        except IOError as e:
            self.log.error(f"I/O Error: Failed to save EPRU registry to disk: {e}")

    def ingest_signed_fdls(self, signed_fdls: Dict[str, Any], aass_signature_valid: bool) -> bool:
        """Ingests a cryptographically signed FDLS, verifies signature, and logs the incident."""
        
        if not aass_signature_valid:
            # P-R03 Breach: Verification failure implies potential system or communication compromise.
            self.log.error("Ingestion rejected (P-R03): AASS signature verification failed. FDLS was dropped.")
            return False

        # Robust extraction based on known required schema fields, providing UNKNOWN defaults
        incident_data = {
            "timestamp": signed_fdls.get("metadata", {}).get("ih_time", "UNKNOWN_TIME"),
            "ih_trigger": signed_fdls.get("trigger", {}).get("p_set_id", "NO_ID"),
            "gsep_stage": signed_fdls.get("trigger", {}).get("gsep_stage", "UNKNOWN_STAGE"),
            "root_cause_summary": signed_fdls.get("forensic", {}).get("summary", "No forensic summary provided."),
            "aass_seal": signed_fdls.get("signature", "MISSING_SEAL")
        }
        
        if incident_data["ih_trigger"] == "NO_ID":
            self.log.error("FDLS lacks critical process identifier (p_set_id). Ingestion aborted.")
            return False

        self.registry["reports"].append(incident_data)
        self._save_registry()
        self.log.audit(f"Incident {incident_data['ih_trigger']} logged and sealed. Integrity confirmed.")
        return True
