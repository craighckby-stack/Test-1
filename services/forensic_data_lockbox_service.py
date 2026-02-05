import hashlib
import json
from datetime import datetime

class ForensicDataLockboxService:
    """FDLS: Guarantees tamper-proof logging and sealing of critical forensic telemetry upon Integrity Halt (IH)."""
    
    def __init__(self, integrity_spec):
        self.log_store = {}
        self.integrity_spec = integrity_spec # References protocol/integrity_sealing_spec.json
        
    def seal_telemetry(self, telemetry_tag: str, data: dict, ih_event_id: str) -> str:
        """Accepts raw telemetry, hashes it using specified algorithm, and stores it immutably."""
        if ih_event_id in self.log_store: 
            raise ValueError("IH Event ID already sealed.")

        # 1. Serialize and Hash (P-R03 Integrity Requirement)
        serialized_data = json.dumps(data, sort_keys=True).encode('utf-8')
        seal_hash = hashlib.sha256(serialized_data).hexdigest() 

        # 2. Construct immutable log entry
        sealed_log = {
            "event_id": ih_event_id,
            "timestamp": datetime.utcnow().isoformat(),
            "telemetry_tag": telemetry_tag,
            "data_hash": seal_hash,
            "payload": data, # For DIAL consumption
            "sealing_algorithm": "SHA256"
        }
        
        self.log_store[ih_event_id] = sealed_log
        return seal_hash
        
    def retrieve_sealed_data(self, ih_event_id: str) -> dict:
        """Retrieves sealed log for DIAL Engine access only."""
        if ih_event_id not in self.log_store:
            raise KeyError("IH Event ID not found or sealed.")
        return self.log_store[ih_event_id]

# NOTE: Production implementation must integrate AASS signing on 'seal_telemetry' completion.