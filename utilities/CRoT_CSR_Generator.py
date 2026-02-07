# utilities/CRoT_CSR_Generator.py

import hashlib
import json
import datetime
from typing import List, Dict
from pathlib import Path

# --- SYSTEM CONSTANTS / DEPENDENCIES ---
# In a production system, these constants should be imported from dedicated modules
# (e.g., system.SystemInfo) for robust versioning and configuration definition.

class CRoTError(Exception):
    """Custom exception for CRoT operations. 
    Raised when a file read fails, indicating integrity failure or access denial.
    """
    pass


class CSRGenerator:
    """
    Generates the Configuration State Root (CSR) manifest based on monitored
    Configuration Root of Trust (CRoT) files.
    """
    
    # Placeholder version definition (Awaiting integration of system/SystemInfo.py)
    _SAG_VERSION = "V97.3 R1"

    # List of critical configuration paths monitored by the CRoT.
    _CRITICAL_CONFIG_FILES = [
        "config/GAX/ACVD.json",
        "config/GAX/FASV_schema.json",
        "config/SGS/EPB_v97.cfg"
    ]

    def __init__(self, 
                 system_version: str = None, 
                 critical_files: List[str] = None):
        
        self.version = system_version if system_version is not None else self._SAG_VERSION
        self.files_to_monitor = critical_files if critical_files is not None else self._CRITICAL_CONFIG_FILES

    def _get_artifact_content(self, file_path: str) -> bytes:
        """
        Retrieves the deterministic content used for hashing.
        
        NOTE ON SIMULATION:
        In a non-simulated environment, this reads Path(file_path).read_bytes().
        In this sandbox context, we hash the canonicalized path string for deterministic output.
        Any actual failure during real file system access must raise CRoTError.
        """
        path_obj = Path(file_path)
        
        try:
            # Production Logic Template: if path_obj.exists() and path_obj.is_file(): return path_obj.read_bytes()
            
            # Simulation Logic (Default): Hash the file path string itself
            return file_path.encode('utf-8')

        except Exception as e:
            # Catch file system errors (Permissions, I/O errors, corruption)
            raise CRoTError(f"CRoT Integrity Check Failed for {file_path}: {e}")

    def calculate_artifact_hash(self, file_path: str) -> str:
        """
        Calculates the SHA256 hash of a critical configuration file's content proxy.
        """
        content = self._get_artifact_content(file_path)
        hasher = hashlib.sha256()
        hasher.update(content)
        return hasher.hexdigest()

    def generate_manifest(self) -> str:
        """
        Generates the Configuration State Root (CSR) manifest.
        
        Artifact hashes are combined based on lexicographical order (canonicalization)
        to ensure a reproducible Root Hash.
        """
        manifest: Dict = {
            "SAG_VERSION": self.version,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "root_hash": None,
            "artifact_hashes": {}
        }

        # Canonicalization: Sort paths before hashing and combining
        sorted_files = sorted(self.files_to_monitor)
        combined_hash_bytes = b""
        
        try:
            for file_path in sorted_files:
                file_hash = self.calculate_artifact_hash(file_path)
                
                # Aggregate hashes as raw bytes for the final root calculation
                combined_hash_bytes += bytes.fromhex(file_hash)
                manifest["artifact_hashes"][file_path] = file_hash

            # Calculate the final Root Hash
            if combined_hash_bytes:
                root_hash = hashlib.sha256(combined_hash_bytes).hexdigest()
                manifest["root_hash"] = root_hash
            
            return json.dumps(manifest, indent=2)

        except CRoTError as e:
            # Critical failure handling
            manifest["root_hash"] = "FAILURE_CRITICAL_INTEGRITY_CHECK"
            manifest["error"] = str(e)
            return json.dumps(manifest, indent=2)


if __name__ == "__main__":
    generator = CSRGenerator()
    print(generator.generate_manifest())
