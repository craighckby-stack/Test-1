# Configuration Governance Registrar (CGR) Utility
# Role: To securely compile, validate, and hash the immutable governance artifacts 
# necessary for establishing the Config State Root (CSR) prior to DSE Phase P1 (S00).

import hashlib
import json

class CGRUtility:
    def __init__(self, acvd_path: str, fasv_path: str):
        self.acvd_path = acvd_path
        self.fasv_path = fasv_path
        self.ACVD = self._load_artifact(acvd_path)
        self.FASV = self._load_artifact(fasv_path)

    def _load_artifact(self, path):
        with open(path, 'r') as f:
            return json.load(f)
            
    def _standardize_and_serialize(self, data) -> str:
        # Ensure deterministic hashing by sorting keys before serialization
        return json.dumps(data, sort_keys=True, indent=None, separators=(',', ':'))

    def calculate_csr(self) -> str:
        """Compiles and hashes ACVD and FASV to generate the verifiable CSR."""
        
        # 1. Deterministically serialize inputs
        acvd_data = self._standardize_and_serialize(self.ACVD)
        fasv_data = self._standardize_and_serialize(self.FASV)
        
        # 2. Concatenate and hash the governance baseline
        baseline_string = f"ACVD:{acvd_data}|FASV:{fasv_data}"
        
        # Use a high-integrity hashing algorithm (e.g., SHA-3 256)
        csr_hash = hashlib.sha3_256(baseline_string.encode('utf-8')).hexdigest()
        
        print(f"CSR calculated successfully: {csr_hash[:16]}...")
        return csr_hash

# Usage Example (Requires ACVD.json and FASV.json to exist):
# registrar = CGRUtility('configs/ACVD.json', 'configs/FASV.json')
# csr = registrar.calculate_csr()