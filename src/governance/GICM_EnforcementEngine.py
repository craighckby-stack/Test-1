import json
import logging
from typing import Dict, Any, Tuple, List, Callable, Type
from datetime import datetime

# --- Configuration & Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(name)s - %(message)s')
logger = logging.getLogger('GICM_Engine')

# Custom Exceptions for clarity
class GICMSchemaError(Exception):
    """Base exception for GICM schema issues."""
    pass

class GICMSetupError(GICMSchemaError):
    """Raised when the GICM schema cannot be loaded or is invalid."""
    pass

class GICMEnforcementEngine:
    
    # Map GICM/JSON Schema types to Python types
    TYPE_MAP: Dict[str, Type] = {
        'string': str,
        'integer': int,
        'number': (int, float),
        'boolean': bool,
        'array': list,
        'object': dict
    }
    
    # Internal Type for a structured violation record
    Violation = Dict[str, Any] 

    def __init__(self, schema_path: str = "config/governance/GICM_Schema.json", logger_instance: Any = None):
        self.schema_path = schema_path
        self.schema: Dict[str, Any] = self._load_schema()
        self.entities: Dict[str, Any] = self.schema.get('entities', {})
        
        # Integration point for the proposed ViolationLogger
        self.violation_logger = logger_instance
        
        if not self.entities:
            logger.warning(f"GICM Schema loaded but contains no entities: {schema_path}")

    def _load_schema(self) -> Dict[str, Any]:
        """Loads and validates the JSON schema file, raising GICMSetupError on failure."""
        try:
            with open(self.schema_path, 'r') as f:
                schema = json.load(f)
            
            if not isinstance(schema, dict) or 'entities' not in schema or 'global_policies' not in schema:
                logger.error(f"Schema file is structurally incomplete: {self.schema_path}")
                raise GICMSetupError("Schema missing core keys ('entities', 'global_policies').")
            
            return schema
        except FileNotFoundError:
            logger.critical(f"GICM Schema file not found: {self.schema_path}")
            raise GICMSetupError(f"Schema file missing: {self.schema_path}")
        except json.JSONDecodeError as e:
            logger.critical(f"GICM Schema file is invalid JSON: {self.schema_path}. Error: {e}")
            raise GICMSetupError(f"Invalid JSON schema: {self.schema_path}")

    def _validate_field_constraints(self, field_name: str, value: Any, props: Dict[str, Any]) -> List[Violation]:
        """Checks data type and specific constraints (e.g., enum, format, min/max)."""
        violations: List[Violation] = []
        expected_type_str = props.get('type')
        
        # --- Type Check ---
        if expected_type_str and value is not None:
            expected_type_py = self.TYPE_MAP.get(expected_type_str)
            
            if expected_type_py is None:
                 violations.append({
                    "code": "UNKNOWN_TYPE",
                    "message": f"Unsupported type '{expected_type_str}' defined for field '{field_name}'.",
                    "field": field_name
                })
            elif not isinstance(value, expected_type_py):
                violations.append({
                    "code": "TYPE_MISMATCH",
                    "message": f"Type mismatch: Field '{field_name}' must be a {expected_type_str} (found {type(value).__name__}).",
                    "field": field_name
                })

        # --- Enumeration Check ---
        allowed_values = props.get('enum')
        if allowed_values and value is not None and value not in allowed_values:
            violations.append({
                "code": "ENUM_VIOLATION", 
                "message": f"Value violation: Field '{field_name}' value '{value}' is not permitted. Must be one of {allowed_values}.",
                "field": field_name
            })
            
        return violations

    def _validate_entity_rules(self, entity_def: Dict[str, Any], record: Dict[str, Any]) -> List[Violation]:
        """
        Executes entity-level integrity rules and cross-field policy checks.
        """
        violations: List[Violation] = []
        
        # Example: Rule ID: GICM_AUDIT_L5_REQ
        if record.get('governance_level') == 'L5_Critical' and not record.get('audit_required_policy'):
            violations.append({
                "code": "GICM_AUDIT_L5_REQ", 
                "message": "L5_Critical entities require 'audit_required_policy' linkage for full audit trail integrity.",
                "field": "audit_required_policy"
            })
                     
        return violations


    def validate_entity(self, entity_name: str, record: Dict[str, Any]) -> Tuple[bool, List[Violation]]:
        """Validates a data record against its defined GICM entity schema."""
        
        if entity_name not in self.entities:
            return False, [{
                "code": "ENTITY_UNKNOWN", 
                "message": f"Unknown entity: {entity_name}", 
                "field": None
            }]
        
        entity_def = self.entities[entity_name]
        all_violations: List[Violation] = []

        # 1. Check Required Fields & Field Constraints
        defined_fields = entity_def.get('fields', {})

        for field, props in defined_fields.items():
            value = record.get(field)
            is_present = field in record and value is not None
            
            # A. Required Check
            if props.get('required') and not is_present:
                all_violations.append({"code": "MISSING_REQUIRED", "message": f"Missing required field: {field}", "field": field})
                continue

            # B. Constraint Check
            if is_present:
                field_violations = self._validate_field_constraints(field, value, props)
                all_violations.extend(field_violations)
        
        # 2. Check Entity-Level Integrity Rules (Cross-field dependencies)
        all_violations.extend(self._validate_entity_rules(entity_def, record))
                     
        # 3. Overall Integrity Model Assessment (Metadata violation)
        if all_violations and entity_def.get('integrity_model'):
            all_violations.insert(0, {
                "code": "INTEGRITY_COMPROMISED", 
                "message": f"Integrity model '{entity_def['integrity_model']}' requirements compromised.",
                "field": None,
                "timestamp": datetime.now().isoformat()
            })

        return not all_violations, all_violations

    def enforce_policy(self, violation_data: List[Violation], entity_name: str, record_identifier: str = "N/A"):
        """
        Triggers external enforcement hooks and logging based on violation data.
        """
        if not violation_data:
            return

        logger.warning(f"GICM Enforcement triggered for entity '{entity_name}'. Violations: {len(violation_data)}")
        
        # 1. Structured Logging
        if self.violation_logger:
            try:
                # Requires the logger instance to implement log_violations
                self.violation_logger.log_violations(entity_name, record_identifier, violation_data)
                logger.info(f"Violations logged successfully by external logger.")
            except Exception as e:
                logger.error(f"Failed to log violations using provided logger: {e}")
                
        # 2. Hook Integration
        
        critical_codes = ["GICM_AUDIT_L5_REQ", "INTEGRITY_COMPROMISED"] # Example list
        is_critical = any(v['code'] in critical_codes for v in violation_data)
        
        if is_critical and self.schema.get('global_policies', {}).get('critical_alert_hook'):
            hook_name = self.schema['global_policies']['critical_alert_hook']
            # Placeholder for actual hook execution logic (e.g., import and call dynamic hook)
            logger.critical(f"[CRITICAL ALERT HOOK]: Triggering handler '{hook_name}'. Record: {record_identifier}.")
        else:
             logger.info(f"Standard GICM violation recorded for {entity_name}.")
