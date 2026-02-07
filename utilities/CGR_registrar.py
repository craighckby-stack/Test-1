# Configuration Governance Registrar (CGR) Utility
# Role: To securely compile, validate, and hash the immutable governance artifacts 
# necessary for establishing the Config State Root (CSR) prior to DSE Phase P1 (S00).

import hashlib
import json
import logging
import sys
from typing import Dict, Any, TypeAlias

# Define a specific type alias for configuration data structures
ConfigData: TypeAlias = Dict[str, Any]

# --- Logging Setup ---
# Standardized format for core utilities. Adjusting for modern Python standard logging features.
if sys.version_info >= (3, 9):
    logging.basicConfig(level=logging.INFO, encoding='utf-8', format='%(levelname)s:CGR:%(message)s')
else:
    logging.basicConfig(level=logging.INFO, format='%(levelname)s:CGR:%(message)s')


class CGRUtility:
    """
    Configuration Governance Registrar (CGR) Utility.
    Role: Compiles, validates, and hashes immutable governance artifacts (ACVD, FASV) 
    to establish the verifiable Config State Root (CSR) prior to DSE initialization.
    """
    
    # Define immutable constants for cryptographic stability
    ENCODING = 'utf-8'
    HASH_ALGORITHM = 'sha3_256'
    
    def __init__(self, acvd_path: str, fasv_path: str):
        # Load artifacts immediately upon instantiation
        self._acvd_data: ConfigData = self._load_artifact(acvd_path)
        self._fasv_data: ConfigData = self._load_artifact(fasv_path)
        
    @classmethod
    def _load_artifact(cls, path: str) -> ConfigData:
        """Loads and parses a JSON artifact with robust error handling.
        Ensures the root object is a dictionary."""
        try:
            with open(path, 'r', encoding=cls.ENCODING) as f:
                logging.debug(f"Attempting to load artifact: {path}")
                data = json.load(f)
                if not isinstance(data, dict):
                     raise ValueError("Artifact root must be a dictionary for configuration governance.")
                return data
        except FileNotFoundError as e:
            logging.critical(f"Required artifact not found: {path}")
            raise IOError(f"Cannot proceed without file: {path}") from e
        except json.JSONDecodeError as e:
            logging.critical(f"Artifact content is invalid JSON: {path}")
            raise ValueError(f"Invalid artifact format in {path}: {e}") from e
        except Exception as e:
            logging.critical(f"Unexpected error loading {path}: {e}")
            raise

    @classmethod
    def _get_deterministic_json_bytes(cls, data: ConfigData) -> bytes:
        """
        Serializes data into deterministic JSON bytes for cryptographic stability.
        Guarantees byte-for-byte consistency using sorted keys and minimal separators.
        """
        serialized_string = json.dumps(
            data, 
            sort_keys=True, 
            separators=(',', ':')
        )
        return serialized_string.encode(cls.ENCODING)
        
    def _compile_baseline_bytes(self) -> bytes:
        """
        Gathers and concatenates all deterministic artifact bytes with fixed, 
        versioned headers to form the cryptographically stable CSR input byte sequence.
        
        Format: [CGR_VERSION_ID]|[ACVD_START_TAG][ACVD_CONTENT]|[FASV_START_TAG][FASV_CONTENT]
        """
        
        acvd_bytes = self._get_deterministic_json_bytes(self._acvd_data)
        fasv_bytes = self._get_deterministic_json_bytes(self._fasv_data)
        
        # Use a versioned prefix for the calculation logic itself to handle future format changes
        baseline_parts = [
            b"CGR_V1_ROOT_COMMIT|ACVD_START:", 
            acvd_bytes, 
            b"|FASV_START:", 
            fasv_bytes
        ]
        
        return b''.join(baseline_parts)

    def calculate_csr(self) -> str:
        """
        Calculates the verifiable Config State Root (CSR) hash.
        This represents the cryptographic summary of all immutable governance artifacts.
        """
        
        baseline_bytes = self._compile_baseline_bytes()
        
        hasher = hashlib.new(self.HASH_ALGORITHM)
        hasher.update(baseline_bytes)
        
        csr_hash = hasher.hexdigest()
        
        logging.info(f"CSR calculated ({self.HASH_ALGORITHM}). Root: {csr_hash[:16]}...")
        return csr_hash
