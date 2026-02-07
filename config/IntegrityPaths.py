# config/IntegrityPaths.py

from pathlib import Path

# --- Baseline Definitions ---
# T0 (Time Zero) refers to the initial, signed baseline configuration.

class IntegrityPaths:
    """Standardized paths and configuration settings for integrity tools."""

    # 1. Input Configuration List
    TBR_FILE: Path = Path("config/TBR.json")
    """The Trusted Base Reference (TBR) file listing all critical artifacts."""

    # 2. Output Manifests Directory
    MANIFEST_DIR: Path = Path("manifest")
    """Base directory for storing governance manifests."""
    
    # 3. Output Manifest Files
    POLICY_MANIFEST_SIG: Path = MANIFEST_DIR / "G0-Policy_Manifest.sig"
    """The final signed governance baseline manifest (aggregate hash)."""

    # 4. Hashing Configuration
    HASH_ALGORITHM: str = "SHA-512"
    """The cryptographic algorithm used for calculating the M-Hash."""
    
    @classmethod
    def initialize(cls):
        """Ensure necessary output directories exist and provide warnings for missing input."""
        cls.MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
        if not cls.TBR_FILE.exists():
             print(f"[IntegrityPaths] Warning: TBR file expected at {cls.TBR_FILE} does not exist. (System requires initial configuration.)")
             
# Initialize configuration upon import (critical for build scripts)
IntegrityPaths.initialize()