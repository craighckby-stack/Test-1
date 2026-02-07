# Environmental Signature Verification Service (ESVS)
# Role: Proactively detect environmental drift before critical process initiation or during passive states.

import hashlib
import json
import os
import sys
import platform
from pathlib import Path
from typing import Dict, Any, List, Optional

# --- Configuration & Utility Constants ---
CORE_SIG_KEY = 'core_environment_v1'
DEFAULT_MANIFEST_PATH = Path('registry/config/esvs_manifest.json')

MANDATORY_BASE_METRICS: List[str] = [
    'os_system', 
    'os_kernel_release', 
    'system_architecture', 
    'python_version_tuple',
    'python_executable_path', 
]

# Define specific error for clean catch handling upstream
class EnvironmentalDriftError(Exception):
    """Raised when the computed environmental signature does not match the expected manifest (IH Mandated failure)."""
    def __init__(self, runtime_sig: str, expected_sig: str, details: str = "Signature mismatch"):
        self.runtime_sig = runtime_sig
        self.expected_sig = expected_sig
        
        # Display shortened hash for concise logging
        runtime_short = runtime_sig[:12] if runtime_sig != "N/A_COLLECTION_FAIL" else runtime_sig
        expected_short = expected_sig[:12] if expected_sig else "MISSING"

        message = (
            f"ESVS_FAIL: Environmental Signature Drift Detected (IH Mandated). "
            f"Details: {details}. Runtime: {runtime_short}... | Expected: {expected_short}..."
        )
        super().__init__(message)

class ESVS:
    """
    Environmental Signature Verification Service (ESVS).
    Utilizes deterministic hashing of defined environmental checkpoints (DSE Checkpoint 0).
    
    This service now includes generation capabilities necessary for establishing trusted baselines 
    in secure staging environments, separating setup from runtime verification.
    """

    def __init__(self, manifest_path: Optional[Path] = None):
        self.manifest_path = manifest_path if manifest_path else DEFAULT_MANIFEST_PATH
        self.expected_signatures = self._load_manifest()

    @staticmethod
    def _serialize_data(data: Dict[str, Any]) -> str:
        """Deterministic serialization required for consistent hashing using canonical JSON structure."""
        return json.dumps(
            data, 
            sort_keys=True, 
            separators=(',', ':'), # Minimal separators enforce canonical structure
            ensure_ascii=False # Ensures global consistency regardless of locale data
        )

    def _load_manifest(self) -> Dict[str, str]:
        """Loads and validates the integrity manifest, raising operational errors on critical failure."""
        try:
            with open(self.manifest_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, dict):
                 raise TypeError("Manifest content is not a dictionary.")
                 
            if CORE_SIG_KEY not in data:
                raise KeyError(f"Manifest '{self.manifest_path}' missing mandatory key: '{CORE_SIG_KEY}'.")
            
            return data

        except FileNotFoundError as e:
            raise RuntimeError(f"ESVS critical manifest not found at: {self.manifest_path}. Cannot guarantee baseline integrity.") from e
        except (json.JSONDecodeError, ValueError) as e:
            raise RuntimeError(f"ESVS manifest corrupted (Invalid JSON/Content) at: {self.manifest_path}.") from e
        except Exception as e:
            raise RuntimeError(f"Unexpected error loading ESVS manifest: {e}")

    def _get_core_checkpoint_data(self) -> Dict[str, Any]:
        """Retrieves fundamental deterministic metrics required for DSE Checkpoint 0."""
        data: Dict[str, Any] = {}
        
        try:
            # Use os.uname and platform for maximum determinism and standard reporting consistency
            uname_info = os.uname()
            data['os_system'] = uname_info.sysname
            data['os_kernel_release'] = uname_info.release
            data['system_architecture'] = platform.machine()
            
            # Python Environment Metrics
            data['python_version_tuple'] = sys.version_info[:3] 
            data['python_executable_path'] = sys.executable 
            
            # Validation Check
            if not all(k in data for k in MANDATORY_BASE_METRICS):
                 raise ValueError("Internal data collection failure: Missing mandated keys.")

            return data

        except Exception as e:
            # Fatal error during metric collection is treated as an immediate drift failure
            expected = self.expected_signatures.get(CORE_SIG_KEY, 'UNKNOWN_MANIFEST')
            raise EnvironmentalDriftError(
                runtime_sig="N/A_COLLECTION_FAIL", 
                expected_sig=expected, 
                details=f"FAILURE: Cannot collect mandatory metric set. Cause: {type(e).__name__}"
            )

    def generate_runtime_signature(self, data: Optional[Dict[str, Any]] = None) -> str:
        """
        Generates the SHA256 hash from deterministically collected and serialized data.
        If data is not provided, it collects the DSE Checkpoint 0 baseline.
        """
        if data is None:
            data = self._get_core_checkpoint_data()
            
        serialized_data = self._serialize_data(data)
        
        return hashlib.sha256(serialized_data.encode('utf-8')).hexdigest()

    def generate_baseline_manifest(self) -> Dict[str, Any]:
        """
        [IH Function] Creates a new manifest dict reflecting the current verified environment state.
        This must only be run in controlled staging environments (e.g., via esvs_baseline_generator tool).
        """
        core_data = self._get_core_checkpoint_data()
        runtime_sig = self.generate_runtime_signature(core_data)
        
        new_manifest = {
            "metadata": {
                "description": "Deterministic System Environment Checkpoint 0 (Core Baseline)",
                "timestamp": int(os.time()),
                "checkpoints": MANDATORY_BASE_METRICS
            },
            # Storing the raw data allows for forensic verification of hash inputs
            "raw_data_core": core_data,
            CORE_SIG_KEY: runtime_sig,
        }
        return new_manifest

    def verify_environment(self) -> bool:
        """Compares current environment signature against the immutable manifest (CORE_SIG_KEY)."""
        runtime_sig = self.generate_runtime_signature()
        expected_sig = self.expected_signatures.get(CORE_SIG_KEY)
        
        if not expected_sig:
             raise RuntimeError("ESVS Manifest configuration error: Expected signature missing.")

        if runtime_sig != expected_sig:
            # Raise structured, high-severity error for handling by the DSE controller
            raise EnvironmentalDriftError(
                runtime_sig=runtime_sig, 
                expected_sig=expected_sig
            )
            
        return True
