# Protocol Consistency Engine (PCE) V1.0
# Custodian: SGS (Execution Agent)

import json
import yaml
from typing import List, Dict, Union

# Reference manifest paths defined in SAG V94.3
GAX_MANIFESTS = [
    "config/GAX/UtilityFunctionRegistry.yaml",
    "config/GAX/FinalityThresholdConfig.yaml",
    "config/GAX/PolicyCorrectionSchema.yaml"
]

SGS_MANIFESTS = [
    "config/SGS/ExecutionContextVerificationManifest.yaml",
    "config/SGS/TargetEvolutionMandateManifest.yaml"
]

CRoT_MANIFESTS = [
    "schema/governance/Governance_State_Manifest.schema.json"
]

class PCEValidationError(Exception):
    pass

class ProtocolConsistencyEngine:
    """
    Ensures structural integrity and version synchronization across all 
    Triumvirate configuration manifests prior to GSEP-C Phase 2 (Axial Gating).
    This operates at GSEP-C Stage S1.
    """
    def __init__(self, required_sag_version: str = "V94.3"):
        self.version = required_sag_version
        self.manifest_map = {
            "GAX": GAX_MANIFESTS,
            "SGS": SGS_MANIFESTS,
            "CRoT": CRoT_MANIFESTS
        }

    def _load_manifest(self, path: str) -> Union[Dict, List]:
        try:
            with open(path, 'r') as f:
                if path.endswith(('.yaml', '.yml')):
                    return yaml.safe_load(f)
                elif path.endswith('.json'):
                    return json.load(f)
                else:
                    raise PCEValidationError(f"Unsupported manifest file type: {path}")
        except (FileNotFoundError, json.JSONDecodeError, yaml.YAMLError) as e:
            raise PCEValidationError(f"Failed to load/parse manifest {path}: {e}")

    def check_consistency(self) -> bool:
        validation_log = {}
        all_passed = True

        for agent, paths in self.manifest_map.items():
            validation_log[agent] = []
            for path in paths:
                try:
                    manifest_data = self._load_manifest(path)
                    
                    # 1. Structural Validation (Simple Check: ensure root is a dict/list)
                    if not isinstance(manifest_data, (dict, list)):
                        raise PCEValidationError("Manifest root structure invalid.")

                    # 2. Version Tag Check (Mandatory SAG version linkage)
                    # Assumes top-level key 'protocol_version' exists in all config manifests
                    # CRoT schemas are exempt from carrying the protocol_version tag
                    if agent not in ['CRoT']:
                         if manifest_data.get('protocol_version') != self.version:
                             raise PCEValidationError(f"Version mismatch. Expected {self.version}, found {manifest_data.get('protocol_version')}")

                    validation_log[agent].append(f"[PASS] {path}: Structural and version checks passed.")
                
                except PCEValidationError as e:
                    validation_log[agent].append(f"[FAIL] {path}: Error - {str(e)}")
                    all_passed = False
                except Exception as e:
                    validation_log[agent].append(f"[FAIL] {path}: Unexpected System Error - {type(e).__name__}")
                    all_passed = False

        if not all_passed:
            # Log validation_log to TVCR if applicable, then halt flow at S1
            print("[PCE HALT]: Protocol Consistency Check failed. STANDARD FAILURE initiated.")
            return False
        
        print("[PCE PASS]: All Triumvirate manifests are structurally consistent and synchronized.")
        return True

# Placeholder for integration logic/entry point (omitted in scaffold file for clarity)
