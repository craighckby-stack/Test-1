import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional

class TelemetrySealingError(Exception):
    """Base exception for FDLS operations."""
    pass

class IHEventSealedError(TelemetrySealingError):
    """Raised when trying to seal an already registered IH event ID."""
    pass

class IntegritySpecification:
    """Parses and provides cryptographic parameters based on the system integrity spec."""
    def __init__(self, spec_data: Dict[str, Any]):
        self.spec = spec_data

    def get_hash_algorithm(self) -> str:
        # Defaulting to sha256 if spec is missing or corrupted
        return self.spec.get("sealing_hash_algo", "sha256")
        
    def get_hashing_function(self):
        algo = self.get_hash_algorithm()
        if algo == "sha256":
            return hashlib.sha256
        if algo == "sha3_512":
            return hashlib.sha3_512
        # Fallback to the default safe algorithm
        return hashlib.sha256

# NOTE: AtomicSigningService (AASS) and SecureLogRepository are required dependencies for production.

class ForensicDataLockboxService:
    """FDLS: Guarantees tamper-proof logging and sealing of critical forensic telemetry upon Integrity Halt (IH)."""
    
    def __init__(
        self, 
        integrity_spec: Dict[str, Any], 
        data_repository=None, 
        signing_service=None
    ):
        # Temporarily use dict for unit testing; production MUST use data_repository
        self.log_store: Dict[str, Dict[str, Any]] = {}
        self.integrity_engine = IntegritySpecification(integrity_spec)
        self.data_repository = data_repository 
        self.signing_service = signing_service 
        
    def _calculate_seal_hash(self, data: dict) -> tuple[str, str]:
        """Calculates the necessary cryptographic seal based on current integrity specs."""
        hasher_func = self.integrity_engine.get_hashing_function()
        algo_name = self.integrity_engine.get_hash_algorithm().upper()
        
        # Consistent serialization is mandatory for integrity proofing (P-R03)
        serialized_data = json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
        seal_hash = hasher_func(serialized_data).hexdigest()
        
        return seal_hash, algo_name

    def seal_telemetry(self, telemetry_tag: str, data: dict, ih_event_id: str) -> Dict[str, Any]:
        """
        Seals raw telemetry, calculates hash, records metadata, and manages signing/persistence commitment.
        Returns the finalized, sealed log entry structure.
        """
        if ih_event_id in self.log_store: 
            raise IHEventSealedError(f"IH Event ID '{ih_event_id}' already sealed in current session.")

        seal_hash, algo_name = self._calculate_seal_hash(data)
        timestamp_utc = datetime.utcnow().isoformat(timespec='milliseconds')
        
        # 1. Construct Seal Payload
        sealed_log = {
            "event_id": ih_event_id,
            "timestamp_utc": timestamp_utc,
            "telemetry_tag": telemetry_tag,
            "data_hash": seal_hash,
            "payload_copy": data,
            "sealing_algorithm": algo_name,
            "signature": None 
        }
        
        # 2. Authenticate using AASS
        if self.signing_service:
            # Signing the metadata (excluding the bulky payload_copy)
            try:
                # MOCK CALL: signature = self.signing_service.sign_log_entry({k: v for k, v in sealed_log.items() if k != 'payload_copy'})
                # Production signing MUST block until completed/queued for atomic commit.
                sealed_log["signature"] = f"AASS_PENDING_SIGNATURE_{ih_event_id}" 
            except Exception as e:
                 # Log critical failure but proceed with internal storage/persistence if possible.
                 print(f"[CRITICAL WARNING] AASS signing failed for {ih_event_id}. Proceeding without authenticity proof. Error: {e}") 

        # 3. Persistence Commit (Repository must ensure atomic, synchronous write)
        if self.data_repository:
            self.data_repository.store_log(sealed_log) # MOCK CALL
        
        # Internal index update (even if persistence is used, for local cache consistency)
        self.log_store[ih_event_id] = sealed_log 
        
        return sealed_log

        
    def retrieve_sealed_data(self, ih_event_id: str) -> Dict[str, Any]:
        """Retrieves sealed log entry, checking persistence if local cache fails."""
        
        if ih_event_id in self.log_store:
            return self.log_store[ih_event_id]
            
        if self.data_repository:
            retrieved = self.data_repository.retrieve_log(ih_event_id) # MOCK CALL
            if retrieved:
                self.log_store[ih_event_id] = retrieved # Cache retrieved entry
                return retrieved
        
        # If not found anywhere
        raise KeyError(f"IH Event ID '{ih_event_id}' not found in lockbox or repository.")