# Execution Post-Mortem Report Utility (EPRU)
# Mandate: Process signed Forensic Data & Log Snapshots (FDLS) to ensure continuous operational feedback and failure analysis integrity.

import json
import os
from typing import Dict, Any

FAILURE_REGISTRY_PATH = 'config/failure_registry.json'

class EPRU:
    def __init__(self):
        self._load_registry()

    def _load_registry(self) -> None:
        # Ensure the failure registry file exists for persistence
        if not os.path.exists(FAILURE_REGISTRY_PATH):
            self.registry = {"reports": []}
        else:
            with open(FAILURE_REGISTRY_PATH, 'r') as f:
                self.registry = json.load(f)

    def _save_registry(self) -> None:
        # Write back the updated registry immediately upon ingestion
        with open(FAILURE_REGISTRY_PATH, 'w') as f:
            json.dump(self.registry, f, indent=4)

    def ingest_signed_fdls(self, signed_fdls: Dict[str, Any], aass_signature_valid: bool) -> bool:
        """Ingests a cryptographically signed FDLS, verifies signature, and logs the incident."""
        
        if not aass_signature_valid:
            # P-R03 breach occurred internally or post-AASS submission
            print("[EPRU: ERROR] Ingestion rejected: AASS signature verification failed.")
            return False

        # Extract relevant failure context based on the immutable schema
        incident_data = {
            "timestamp": signed_fdls.get("metadata", {}).get("ih_time"),
            "ih_trigger": signed_fdls.get("trigger", {}).get("p_set_id"),
            "gsep_stage": signed_fdls.get("trigger", {}).get("gsep_stage"),
            "root_cause_summary": signed_fdls.get("forensic", {}).get("summary"),
            "aass_seal": signed_fdls.get("signature")
        }

        self.registry["reports"].append(incident_data)
        self._save_registry()
        print(f"[EPRU: SUCCESS] Incident {incident_data['ih_trigger']} logged and sealed.")
        return True

# Note: This utility requires 'config/failure_registry.json' to be treated as a highly protected, append-only artifact to maintain the audit trail.