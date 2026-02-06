import hashlib
import logging

# Standard logger setup is assumed elsewhere (Scaffold proposed)
logger = logging.getLogger(__name__)

class IntegrityHashValidator:
    """Validates the integrity hash of incoming mandated payloads (GSEP L0).

    This ensures payload integrity before resource-intensive decoding and processing.
    Defaults to SHA-256 validation.
    """
    # Algorithm choice defined here, ready for external configuration override
    HASH_ALGORITHM = 'sha256'
    
    @staticmethod
    def _calculate_hash(content_data: bytes) -> str:
        """Helper to calculate the hash digest based on configured algorithm."""
        algo = IntegrityHashValidator.HASH_ALGORITHM.lower()
        
        if algo == 'sha256':
            return hashlib.sha256(content_data).hexdigest()
        # Future expansion point for sha512, hmac, etc.
        else:
            raise ValueError(f"Unsupported hash algorithm specified: {algo}")

    @staticmethod
    def validate_hash(encoded_content: str, expected_hash: str) -> bool:
        """
        Compares the generated hash of the content against the expected hash.
        The hash is calculated on the raw UTF-8 byte representation of the input string.
        """
        if not encoded_content or not expected_hash:
            logger.warning("Attempted integrity validation with missing content or expected hash.")
            return False
        
        try:
            content_bytes = encoded_content.encode('utf-8')
            calculated_hash = IntegrityHashValidator._calculate_hash(content_bytes)
        except ValueError as e:
            logger.critical(f"Integrity check configuration failed: {e}")
            return False
        
        # Case-insensitive comparison
        if calculated_hash.lower() != expected_hash.lower():
            logger.error(
                f"[HASH MISMATCH:{IntegrityHashValidator.HASH_ALGORITHM}] "
                f"Expected: {expected_hash[:12]}..., Calculated: {calculated_hash[:12]}..."
            )
            # Log full hashes at debug level for forensic analysis
            logger.debug(f"Full comparison failure. Calc: {calculated_hash}, Exp: {expected_hash}")
            return False
        
        logger.debug(f"Payload integrity verified using {IntegrityHashValidator.HASH_ALGORITHM}.")
        return True
