import json
import hashlib
import time
import logging
from typing import Dict, Any, Optional

# NOTE: Assuming centralized logging configuration has been established by the system.
logger = logging.getLogger('GovernanceTransmitter')
logger.setLevel(logging.INFO)

class GovernanceTransmitter:
    """
    Manages secure packaging, integrity signing, and initiation of 
    governance proposals directed towards the Policy Configuration Server (PCS).

    Responsibilities:
    1. Canonicalization and signing of proposals (integrity check).
    2. Adding essential attestation metadata (timestamp, source).
    3. Initiating simulated transmission to the PCS endpoint.
    """
    
    # Explicitly define mandatory structural components for every proposal.
    MANDATORY_FIELDS = {'SOURCE_DAEMON', 'ADJUSTMENT_TYPE', 'RATIONALE', 'PAYLOAD'}

    def __init__(self, pcs_endpoint: str):
        """Initializes the transmitter with the target Policy Configuration Server endpoint."""
        if not pcs_endpoint:
            raise ValueError("PCS endpoint cannot be empty.")
        self.pcs_endpoint = pcs_endpoint
        logger.debug(f"Initialized GovernanceTransmitter targeting {self.pcs_endpoint}")

    @staticmethod
    def _create_payload_signature(proposal: Dict[str, Any]) -> str:
        """Generates a unique, reproducible SHA256 signature for the canonicalized proposal.
        Ensures consistent hashing using sorted keys and minimal separators.
        """
        try:
            canonical_proposal = json.dumps(proposal, sort_keys=True, separators=(',', ':'))
            return hashlib.sha256(canonical_proposal.encode('utf-8')).hexdigest()
        except TypeError as e:
            logger.error(f"Serialization error during signature generation: {e}")
            raise

    def _validate_proposal(self, proposal: Dict[str, Any]) -> bool:
        """Checks if the proposal meets all mandatory structural requirements."""
        missing = self.MANDATORY_FIELDS - proposal.keys()
        if missing:
            logger.error(f"Proposal validation failed: Missing fields: {list(missing)}.")
            return False
        return True

    def transmit(self, proposal: Dict[str, Any]) -> Optional[str]:
        """
        Packages the proposal, generates metadata, and initiates transmission.
        Returns the payload hash (tracking ID) on success, or None on failure.
        """
        if not self._validate_proposal(proposal):
            return None

        # 1. Generate Attestation and Integrity Hash
        try:
            payload_hash = self._create_payload_signature(proposal)
        except Exception:
            logger.error("Aborting transmission due to failed signature generation.")
            return None

        attestation_metadata = {
            "timestamp_utc": time.time(),
            "source_daemon": proposal['SOURCE_DAEMON'],
            "payload_hash": payload_hash,
            "governance_protocol_version": "v94.1"
        }

        # 2. Final Package Assembly
        final_package = {
            "metadata": attestation_metadata,
            "proposal_data": proposal
        }

        try:
            package_json = json.dumps(final_package, indent=None)
            
            # Step 3: Simulate secure logging and asynchronous transmission initiation
            logger.info(
                f"Tx initiated: {proposal['ADJUSTMENT_TYPE']} | Hash: {payload_hash[:10]}... | Target: {self.pcs_endpoint}"
            )
            
            # NOTE: Actual network transmission (e.g., via a dedicated SecureTransport utility)
            # is implicitly handled here by a future component, typically asynchronously.
            # For simulation:
            time.sleep(0.0001)

            logger.debug("Transmission channel confirmed. Payload released.")
            
            return payload_hash
        
        except Exception as e:
            logger.critical(f"Transmission CRITICAL FAILURE for {proposal.get('ADJUSTMENT_TYPE', 'unknown')}: {e}", exc_info=True)
            return None
