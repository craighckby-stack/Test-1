#!/usr/bin/env python
# integrity_initializer.py: Mandated Pre-G0 Integrity Check Layer

import json
import hashlib
import os

POLICY_NEXUS_PATH = 'protocol/pgn_master.yaml'

class IntegrityInitializer:
    """Validates foundational configuration integrity (GAX, P-Set specs) 
    against the PGN checksums prior to activating the PIM (G0 readiness)."""
    
    def __init__(self):
        self.pgn = self._load_pgn_nexus()

    def _load_pgn_nexus(self):
        # Simulation: Load and parse the Policy Governance Nexus specification
        # In production, this would involve secured, signed file loading.
        print(f"[INIT] Loading Nexus: {POLICY_NEXUS_PATH}")
        # Assuming YAML structure loaded here
        return {
            'version': '1.0',
            'checksums': {
                'protocol/gax_master.yaml': 'sha256:abcd123...', 
                'protocol/cryptographic_manifest.json': 'sha256:efgh456...', 
            }
        }

    def calculate_checksum(self, filepath):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Mandatory config file missing: {filepath}")
        
        # Simple hash calculation for demonstration
        with open(filepath, 'rb') as f:
            data = f.read()
            return f"sha256:{hashlib.sha256(data).hexdigest()}"

    def run_preflight_check(self):
        print("[INIT] Running foundational integrity audit.")
        all_validated = True
        
        for path, mandated_hash in self.pgn['checksums'].items():
            try:
                current_hash = self.calculate_checksum(path)
                if current_hash != mandated_hash:
                    print(f"[ERROR] Checksum Mismatch: {path}")
                    print(f"    Expected: {mandated_hash}")
                    print(f"    Actual:   {current_hash}")
                    all_validated = False
                else:
                    print(f"[OK] Validated {path}")
            except Exception as e:
                print(f"[CRITICAL ERROR] Initializer failure: {e}")
                return False
        
        if not all_validated:
            raise SystemExit("FATAL: Pre-G0 integrity breach detected. Cannot proceed.")
        
        print("[INIT] Foundational Integrity Passed. Handing control to PIM/EMSU (G0)." )
        return True

if __name__ == '__main__':
    # Mock file existence for demonstration
    # os.makedirs('protocol', exist_ok=True)
    # with open('protocol/gax_master.yaml', 'w') as f: f.write('content')
    # with open('protocol/cryptographic_manifest.json', 'w') as f: f.write('content')
    
    # IntegrityInitializer().run_preflight_check() 
    # Requires actual file structure for live execution
    pass
