import hashlib
import base64

class IntegrityHashValidator:
    """Validates the integrity hash of incoming mandated payloads.

    Crucial for GSEP L0 processing before decoding resource-intensive payloads.
    """
    @staticmethod
    def validate_hash(encoded_content: str, expected_hash: str) -> bool:
        """Compares the generated SHA-256 hash of the content against the expected hash."""
        if not encoded_content or not expected_hash:
            return False
        
        # The hash must be calculated on the received (potentially base64 encoded) content.
        content_bytes = encoded_content.encode('utf-8')
        calculated_hash = hashlib.sha256(content_bytes).hexdigest()
        
        if calculated_hash.lower() != expected_hash.lower():
            print(f"[ERROR: HASH MISMATCH] Calculated: {calculated_hash}, Expected: {expected_hash}")
            return False
        
        return True

# SCR integration example:
# is_valid = IntegrityHashValidator.validate_hash(payload['mandated_payload']['diff_content'], payload['c_frame']['code_patch_integrity_hash'])