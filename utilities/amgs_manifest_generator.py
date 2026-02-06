#!/usr/bin/env python3
import hashlib
import json
import os
import sys
from typing import Dict, Optional, List

# Target system version, usually injected during build/deployment, hardcoded for utility isolation.
SYSTEM_VERSION = "v94.1_CHR_Lock"

# NOTE: This list currently mirrors the 'System Artifact Registry' in the DSE Specification.
# Architectural debt exists here; subsequent versions should load this list dynamically.
GOVERNING_ARTIFACTS: List[str] = [
    'config/gsep_c_flow.json',
    'config/acvm.json',
    'governance/smc_schema.json',
    'config/dial_analysis_map.json',
    'protocol/fdls_spec.json',
    'protocol/chr_schema.json',
    'config/rrp_manifest.json',
    'protocol/telemetry_spec.json'
]

TARGET_MANIFEST_PATH = 'registry/chr_manifest.json'

def calculate_sha256(file_path: str) -> Optional[str]:
    """Calculates SHA256 hash for a given file path using buffered reading."""
    hasher = hashlib.sha256()
    buffer_size = 65536 # 64KB buffer for efficient I/O
    
    try:
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(buffer_size)
                if not chunk:
                    break
                hasher.update(chunk)
        return hasher.hexdigest()
    except FileNotFoundError:
        return None
    except IOError as e:
        print(f"Error reading {file_path}: {e}", file=sys.stderr)
        return None

def generate_chr_manifest() -> bool:
    """
    Generates the Configuration Hash Registry (CHR) manifest.
    Returns True if successful, False otherwise.
    """
    manifest: Dict = {
        "metadata": {
            "version": SYSTEM_VERSION,
            "timestamp_utc": os.path.getctime(__file__),
            "lock_type": "AMGS_Sovereign_Integrity_Lock"
        },
        "artifacts": {}
    }
    
    missing_artifacts: List[str] = []
    
    print(f"--- AMGS Manifest Generator ({SYSTEM_VERSION}): Hashing Critical Artifacts ---")
    
    for path in GOVERNING_ARTIFACTS:
        file_hash = calculate_sha256(path)
        
        if file_hash:
            manifest['artifacts'][path] = file_hash
        else:
            # File was either not found or could not be read
            missing_artifacts.append(path)
            print(f"  [CRITICAL FAILURE] Missing/Unreadable artifact: {path}", file=sys.stderr)
            
    
    if missing_artifacts:
        print("\n[INTEGRITY FAILURE] CHR Generation Halted. System artifacts missing.")
        for artifact in missing_artifacts:
            print(f"  -> {artifact}")
        return False
    
    # Ensure the registry directory exists
    os.makedirs(os.path.dirname(TARGET_MANIFEST_PATH), exist_ok=True)
    
    try:
        # Lock the generated manifest
        with open(TARGET_MANIFEST_PATH, 'w') as f:
            json.dump(manifest, f, indent=4)
        
        print(f"\n[SUCCESS] CHR Manifest ({len(manifest['artifacts'])} artifacts) locked at: {TARGET_MANIFEST_PATH}")
        return True
    except IOError as e:
        print(f"[FATAL ERROR] Could not write manifest to {TARGET_MANIFEST_PATH}: {e}", file=sys.stderr)
        return False

if __name__ == '__main__':
    if not generate_chr_manifest():
        sys.exit(1)
