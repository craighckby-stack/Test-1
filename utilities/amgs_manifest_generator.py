#!/usr/bin/env python3
import hashlib
import json
import os

# NOTE: This list MUST mirror the 'System Artifact Registry' in the DSE Specification (README)
GOVERNING_ARTIFACTS = [
    'config/gsep_c_flow.json',
    'config/acvm.json',
    'governance/smc_schema.json',
    'config/dial_analysis_map.json',
    'protocol/fdls_spec.json',
    'protocol/chr_schema.json', # Used for self-verification structure
    'config/rrp_manifest.json',
    'protocol/telemetry_spec.json'
]

TARGET_MANIFEST_PATH = 'registry/chr_manifest.json'

def generate_hash(file_path):
    """Calculates SHA256 hash for a given file."""
    hasher = hashlib.sha256()
    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(4096):
                hasher.update(chunk)
        return hasher.hexdigest()
    except FileNotFoundError:
        print(f"Error: Missing governing artifact: {file_path}")
        return None

def generate_chr_manifest():
    manifest = {"version": "v94.1", "artifacts": {}}
    valid = True
    
    print("--- AMGS: Generating Configuration Hash Registry Manifest ---")
    for path in GOVERNING_ARTIFACTS:
        file_hash = generate_hash(path)
        if file_hash:
            manifest['artifacts'][path] = file_hash
            print(f"  [OK] Hashed {path}")
        else:
            valid = False
    
    if not valid:
        print("--- Generation Halted: Not all dependencies were found. --- ")
        return
    
    # Ensure the registry directory exists
    os.makedirs(os.path.dirname(TARGET_MANIFEST_PATH), exist_ok=True)
    
    # Lock the generated manifest
    with open(TARGET_MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=4)
    
    print(f"\n[SUCCESS] CHR Manifest locked at: {TARGET_MANIFEST_PATH}")

if __name__ == '__main__':
    generate_chr_manifest()