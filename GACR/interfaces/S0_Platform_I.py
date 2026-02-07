from typing import Protocol, List, Optional, Tuple

# --- Sovereign AGI GACR Interfaces (GSEP-C S0 Environment) ---
# Protocols defining standardized access paths for hardware and cryptographic primitives,
# primarily utilized by the HETMVerifier/Trust Anchor system.

class CRACryptoInterface(Protocol):
    """Certificate and Root of Trust Cryptography Access (CRA).
    Handles core cryptographic operations required for verification and key access."""

    def verify(self, payload: bytes, signature: bytes, public_key: bytes) -> bool:
        """Verifies the signature against the payload using the specified key."""
        ...

    def get_public_key(self, key_id: str) -> Optional[bytes]:
        """Retrieves a securely provisioned public key (e.g., identity or platform key) by ID."""
        ...


class HIPAHardwareInterface(Protocol):
    """Hardware Isolation and Platform Access (HIPA).
    Provides access to platform measurements, feature flags, and secure processing features."""

    def get_platform_measurement(self) -> bytes:
        """Returns the canonical, raw measured root-of-trust state (e.g., composite PCR hash or hash log).
        Return type changed to bytes for cryptographic integrity."""
        ...

    def get_attestation_quote(self, nonce: bytes) -> Tuple[bytes, bytes]:
        """Generates a signed attestation quote over current platform state, incorporating a fresh nonce.
        Returns (quote_data, signature). Essential for remote verification in HETMVerifier."""
        ...

    def has_features(self, required_features: List[str]) -> bool:
        """Checks if the underlying hardware/firmware exposes specific required features (e.g., trusted execution flags, specific TPM capabilities)."""
        ...


class NetSecInterface(Protocol):
    """Secure Network Connectivity Verification."""
    def verify_endpoint_reachability(self, endpoint_uri: str, timeout: int) -> bool:
        """Attempts to verify reachability, TLS handshake success, and security of a critical endpoint (e.g., audit server, management plane)."""
        ...