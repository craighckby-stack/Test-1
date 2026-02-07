# Environmental Signature Verification Service (ESVS)
# Role: Proactively detect environmental drift before critical process initiation or during passive states.

import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any

# Define specific error for clean catch handling upstream
class EnvironmentalDriftError(Exception):
    """Raised when the computed environmental signature does not match the expected manifest."""
    def __init__(self, runtime_sig: str, expected_sig: str, details: str = "Signature mismatch"):
        self.runtime_sig = runtime_sig
        self.expected_sig = expected_sig
        message = (
            f"ESVS_FAIL: Environmental Signature Drift Detected. IH Mandated. "
            f"Details: {details}. Runtime: {self.runtime_sig[:12]}... | Expected: {self.expected_sig[:12]}..."
        )
        super().__init__(message)

class ESVS:
    """
    Environmental Signature Verification Service (ESVS).
    Utilizes deterministic hashing of defined environmental checkpoints (DSE Checkpoint 0).
    
    Note: Future versions should use an injected configuration object (ESVS_Profile) to define 
    additional file/environment variable checks beyond the core OS metrics.
    """
    
    DEFAULT_MANIFEST_PATH = Path('registry/config/esvs_manifest.json')
    CORE_SIG_KEY = 'core_environment_v1'
    
    # Explicitly defines the minimum deterministic data components required for DSE Checkpoint 0.
    MANDATORY_BASE_METRICS = [
        'os_system', 
        'os_kernel_release', 
        'system_architecture', 
        'python_version_tuple', # Using tuple/list for stability
        'python_executable_path', 
    ]

    def __init__(self, manifest_path: Path = None):
        self.manifest_path = manifest_path if manifest_path else self.DEFAULT_MANIFEST_PATH
        self.expected_signatures = self._load_manifest()

    def _load_manifest(self) -> Dict[str, str]:
        """Loads and validates the integrity manifest, providing specific exceptions for I/O errors."""
        try:
            with open(self.manifest_path, 'r') as f:
                data = json.load(f)
            
            if self.CORE_SIG_KEY not in data:
                raise KeyError(f"Manifest '{self.manifest_path}' missing mandatory key: '{self.CORE_SIG_KEY}'.")
            
            return data

        except FileNotFoundError:
            raise FileNotFoundError(f"ESVS critical manifest not found at: {self.manifest_path}. Cannot guarantee baseline integrity.")
        except json.JSONDecodeError:
            raise ValueError(f"ESVS manifest corrupted (Invalid JSON) at: {self.manifest_path}.")


    def _collect_base_metrics(self) -> Dict[str, Any]:
        """Retrieves fundamental deterministic metrics required for DSE Checkpoint 0."""
        data: Dict[str, Any] = {}
        try:
            # 1. OS Metrics (Posix standard assumed for robust systems)
            uname_info = os.uname()
            data['os_system'] = uname_info.sysname
            data['os_kernel_release'] = uname_info.release
            data['system_architecture'] = uname_info.machine
            
            # 2. Python Environment Metrics
            # Use list/tuple of version components for highly deterministic serialization
            data['python_version_tuple'] = sys.version_info[:3] 
            data['python_executable_path'] = sys.executable 
            
            # Internal Check: Ensure collection gathered all mandated fields.
            if not all(k in data for k in self.MANDATORY_BASE_METRICS):
                 # This should ideally be caught upstream, but acts as a final safeguard
                 raise ValueError("Internal error: Missing critical OS or Python data during collection.")

            return data

        except Exception as e:
            # Immediate failure (Drift) if fundamental data collection fails (e.g., non-POSIX OS or permissions error)
            expected = self.expected_signatures.get(self.CORE_SIG_KEY, 'UNKNOWN_MANIFEST')
            raise EnvironmentalDriftError(
                runtime_sig="N/A_COLLECTION_FAIL", 
                expected_sig=expected, 
                details=f"Failure during mandatory metric collection: {type(e).__name__} - {e}"
            )

    def _serialize_data(self, data: Dict[str, Any]) -> str:
        """Deterministic serialization required for consistent hashing using canonical JSON structure."""
        return json.dumps(
            data, 
            sort_keys=True, 
            separators=(',', ':') # Minimal separators enforce canonical structure
        )
    
    def _generate_runtime_signature(self) -> str:
        """Generates the SHA256 hash from deterministically collected and serialized data."""
        data = self._collect_base_metrics()
        serialized_data = self._serialize_data(data)
        
        return hashlib.sha256(serialized_data.encode('utf-8')).hexdigest()

    def verify_environment(self) -> bool:
        """Compares current environment signature against the immutable manifest."""
        runtime_sig = self._generate_runtime_signature()
        expected_sig = self.expected_signatures.get(self.CORE_SIG_KEY)
        
        if runtime_sig != expected_sig:
            # Raise structured, high-severity error for handling by the DSE controller
            raise EnvironmentalDriftError(
                runtime_sig=runtime_sig, 
                expected_sig=expected_sig
            )
            
        return True
