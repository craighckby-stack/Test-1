# Configuration Governance Registrar (CGR) Utility
# Role: To securely compile, validate, and hash the immutable governance artifacts 
# necessary for establishing the Config State Root (CSR) prior to DSE Phase P1 (S00).

import hashlib
import json
import logging
from typing import Dict, Any, TypeAlias

# Configure a standardized logger for critical utilities
logging.basicConfig(level=logging.INFO, format='%(levelname)s:CGR:%(message)s')

# Define a specific type alias for configuration data structures
ConfigData: TypeAlias = Dict[str, Any]

class CGRUtility:
    # Define immutable constants for cryptographic stability
    ENCODING = 'utf-8'
    HASH_ALGORITHM = 'sha3_256'
    
    def __init__(self, acvd_path: str, fasv_path: str):
        # Load artifacts immediately upon instantiation, raising exceptions if necessary
        # Renaming instance variables to follow snake_case convention for encapsulation
        self._acvd_data: ConfigData = self._load_artifact(acvd_path)
        self._fasv_data: ConfigData = self._load_artifact(fasv_path)
        
    @classmethod
    def _load_artifact(cls, path: str) -> ConfigData:
        """Loads and parses a JSON artifact with robust error handling.
        Uses class method to access class constants (ENCODING)."""
        try:
            # Use class constant for encoding
            with open(path, 'r', encoding=cls.ENCODING) as f:
                return json.load(f)
        except FileNotFoundError as e:
            logging.critical(f"Required artifact not found: {path}")
            raise IOError(f"Cannot proceed without file: {path}") from e
        except json.JSONDecodeError as e:
            logging.critical(f"Artifact content is invalid JSON: {path}")
            raise ValueError(f"Invalid artifact format: {path}") from e
        except Exception as e:
            logging.critical(f"Unexpected error loading {path}: {e}")
            raise

    @classmethod
    def _get_deterministic_json_bytes(cls, data: ConfigData) -> bytes:
        """Serializes data into deterministic JSON bytes for cryptographic stability.
        Uses class method to access class constants (ENCODING)."""
        # Sort keys and use minimal separators to ensure consistent, compact serialization.
        serialized_string = json.dumps(
            data, 
            sort_keys=True, 
            separators=(',', ':')
        )
        return serialized_string.encode(cls.ENCODING)

    def calculate_csr(self) -> str:
        """Calculates the verifiable Config State Root (CSR) hash using SHA-3 256."""
        
        # 1. Get deterministic byte streams for each artifact
        acvd_bytes = self._get_deterministic_json_bytes(self._acvd_data)
        fasv_bytes = self._get_deterministic_json_bytes(self._fasv_data)
        
        # 2. Compile baseline byte sequence (Header + Content concatenation)
        baseline_parts = [
            b"ACVD:", acvd_bytes, 
            b"|FASV:", fasv_bytes
        ]
        
        # Initialization uses self.HASH_ALGORITHM, which is correct
        hasher = hashlib.new(self.HASH_ALGORITHM)
        
        for part in baseline_parts:
            hasher.update(part)
        
        csr_hash = hasher.hexdigest()
        
        logging.info(f"CSR generated: {csr_hash[:16]}...")
        return csr_hash

# Usage Example (Requires ACVD.json and FASV.json to exist):
# if __name__ == '__main__':
#     try:
#         # Assuming 'configs/ACVD.json' and 'configs/FASV.json' exist for demonstration
#         registrar = CGRUtility('configs/ACVD.json', 'configs/FASV.json')
#         csr = registrar.calculate_csr()
#         print(f"Final CSR: {csr}")
#     except Exception as e:
#         logging.error(f"CSR registration failed: {e}")
