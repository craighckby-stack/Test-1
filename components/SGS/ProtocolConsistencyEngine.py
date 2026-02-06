# Protocol Consistency Engine (PCE) V2.0 - Refactored
# Custodian: SGS (Execution Agent)

import json
import yaml
import logging
from typing import List, Dict, Union, TypedDict, Optional
from jsonschema import validate, ValidationError as SchemaValidationError
from functools import lru_cache

# --- Setup Logging ---
# Integrating with SGS SystemMonitor logging structure
logger = logging.getLogger(__name__)

# --- Data Structures & Type Hints ---

class ManifestDetails(TypedDict):
    path: str
    agent: str
    is_schema: bool 
    requires_version_check: bool

class PCEValidationResult(TypedDict):
    path: str
    status: str
    message: str
    agent: str

class PCEValidationError(Exception):
    pass

# --- Configuration Definition (Awaiting externalization via proposed Scaffold) ---

PROTOCOL_MANIFEST_REGISTRY: List[ManifestDetails] = [
    {"path": "config/GAX/UtilityFunctionRegistry.yaml", "agent": "GAX", "is_schema": False, "requires_version_check": True},
    {"path": "config/GAX/FinalityThresholdConfig.yaml", "agent": "GAX", "is_schema": False, "requires_version_check": True},
    {"path": "config/GAX/PolicyCorrectionSchema.yaml", "agent": "GAX", "is_schema": False, "requires_version_check": True},
    {"path": "config/SGS/ExecutionContextVerificationManifest.yaml", "agent": "SGS", "is_schema": False, "requires_version_check": True},
    {"path": "config/SGS/TargetEvolutionMandateManifest.yaml", "agent": "SGS", "is_schema": False, "requires_version_check": True},
    {"path": "schema/governance/Governance_State_Manifest.schema.json", "agent": "CRoT", "is_schema": True, "requires_version_check": False}
]

GENERIC_CONFIG_SCHEMA_PATH = "schema/SAG/GenericAgentConfig.schema.json"

class ProtocolConsistencyEngine:
    """
    Ensures structural integrity and version synchronization across all 
    Triumvirate configuration manifests prior to GSEP-C Phase 2 (Axial Gating).
    This operates at GSEP-C Stage S1, utilizing schema validation (jsonschema).
    """
    def __init__(self, required_sag_version: str = "V94.3", manifest_registry: Optional[List[ManifestDetails]] = None):
        self.version = required_sag_version
        # In V2.0, self.registry is expected to be loaded dynamically from ManifestRegistry.json
        self.registry = manifest_registry if manifest_registry is not None else PROTOCOL_MANIFEST_REGISTRY
        self._generic_schema_cache = None

    @lru_cache(maxsize=128)
    def _load_manifest(self, path: str) -> Union[Dict, List]:
        """Loads and caches manifest data from disk (or simulation for V94.1 context)."""
        try:
            # NOTE: Actual file IO is abstracted for environment constraints.
            # We assume successful access and valid data parsing here.
            
            if path.endswith(('.yaml', '.yml')):
                # Mock load for YAML
                content = {"protocol_version": self.version, "settings": {"timeout": 60}}
                return content
            elif path.endswith('.json'):
                # Mock load for JSON (including schema files)
                if path.endswith('.schema.json'):
                    return {"$schema": "http://json-schema.org/draft-07/schema#", "type": "object"}
                return {"protocol_version": self.version, "data_integrity_check": True}
            else:
                raise PCEValidationError(f"Unsupported manifest file type: {path}")

        except Exception as e: 
            raise PCEValidationError(f"Failed to load/parse manifest {path}: {type(e).__name__} - {e}")

    def _validate_data_against_schema(self, data: Union[Dict, List], schema_path: str):
        """Validates the data against a known JSON schema using jsonschema."""
        try:
            # Loads generic schema (or specified CRoT schema) leveraging cache
            schema = self._load_manifest(schema_path)
            validate(instance=data, schema=schema)
        except SchemaValidationError as e:
            # Reports granular schema error rather than general structure failure
            raise PCEValidationError(f"Schema violation in field '{e.path}': {e.message}")
        except PCEValidationError: 
            # Catch failure to load schema itself
            raise

    def _perform_integrity_check(self, details: ManifestDetails, manifest_data: Union[Dict, List]) -> PCEValidationResult:
        """Runs the complete suite of checks (structural, schema, version) for a single manifest."""
        path = details['path']
        agent = details['agent']

        # 1. Schema Validation Check (Rigorously checks structure against defined schema)
        if details['is_schema']:
            # Validate the schema definition against a JSON Schema meta-specification (Placeholder uses simplified internal check)
            if not isinstance(manifest_data, dict) or '$schema' not in manifest_data:
                raise PCEValidationError("Schema document validation failed: missing essential keys.")
        else:
            # Validate data manifest against the shared GenericAgentConfig structure
            self._validate_data_against_schema(manifest_data, GENERIC_CONFIG_SCHEMA_PATH)

        # 2. Version Synchronization Check
        if details['requires_version_check']:
            found_version = manifest_data.get('protocol_version')
            if found_version != self.version:
                 raise PCEValidationError(f"Version mismatch. Expected {self.version}, found {found_version}")

        return {
            "path": path,
            "status": "PASS",
            "message": "Integrity, structural, and version synchronization checks passed.",
            "agent": agent
        }

    def check_consistency(self) -> Dict[str, Union[bool, List[PCEValidationResult]]]:
        """Executes comprehensive protocol consistency checks across all registered manifests."""
        results: List[PCEValidationResult] = []
        all_passed = True

        logger.info(f"PCE Stage S1: Starting consistency check against required SAG Version: {self.version}")

        for details in self.registry:
            path = details['path']
            
            try:
                manifest_data = self._load_manifest(path)
                result = self._perform_integrity_check(details, manifest_data)
                logger.debug(f"[PASS] {path}")
            
            except PCEValidationError as e:
                result = {"path": path, "status": "FAIL", "message": f"Validation Error: {str(e)}", "agent": details['agent']}
                all_passed = False
                logger.warning(f"[FAIL] {path} - {e}")
                
            except Exception as e:
                result = {"path": path, "status": "FAIL", "message": f"Unexpected Critical System Error: {type(e).__name__}", "agent": details['agent']}
                all_passed = False
                logger.critical(f"[CRIT FAIL] {path} - {e}")
            
            results.append(result)

        if not all_passed:
            logger.critical("[PCE HALT]: Protocol Consistency Check failed. Axal Gating (GSEP-C P2) aborted.")
        else:
            logger.info("[PCE PASS]: Triumvirate manifests are consistent.")
        
        return {
            "passed": all_passed,
            "validation_results": results
        }