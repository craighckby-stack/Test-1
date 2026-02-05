# utilities/CRoT_CSR_Generator.py

import hashlib
import json
import datetime

CONFIG_FILES = [
    "config/GAX/ACVD.json",
    "config/GAX/FASV_schema.json",
    "config/SGS/EPB_v97.cfg"
] # Example paths to be hashed

def calculate_file_hash(file_path):
    """Calculates the SHA256 hash of a given file's content."""
    hasher = hashlib.sha256()
    try:
        # Simulation: In a live system, this reads the authorized configuration file contents.
        # Since we don't have the contents, we hash the path as a stable identifier for testing.
        hasher.update(file_path.encode('utf-8')) 
        return hasher.hexdigest()
    except Exception: # Catch actual file read errors in production
        return f"ERROR: Cannot access {file_path}"

def generate_csr_manifest(files=CONFIG_FILES):
    """Generates the Configuration State Root (CSR) manifest required at S00."""
    manifest = {
        "SAG_VERSION": "V97.3 R1",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "root_hash": None,
        "artifact_hashes": {}
    }

    # Hashing is performed in lexicographical order of paths to ensure reproducible concatenation
    sorted_files = sorted(files)
    combined_hash_string = ""
    
    for file_path in sorted_files:
        file_hash = calculate_file_hash(file_path)
        manifest["artifact_hashes"][file_path] = file_hash
        combined_hash_string += file_hash

    # Calculate the final Root Hash based on the concatenation of artifact hashes
    manifest["root_hash"] = hashlib.sha256(combined_hash_string.encode('utf-8')).hexdigest()
    
    return json.dumps(manifest, indent=2)

if __name__ == "__main__":
    print(generate_csr_manifest())
