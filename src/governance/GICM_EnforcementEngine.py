import json
import logging
from typing import Dict, Any, Tuple, List

# Configure basic logging for internal errors
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger('GICM_Engine')

class GICM_EnforcementEngine:
    def __init__(self, schema_path: str = "config/governance/GICM_Schema.json"):        
        self.schema_path = schema_path
        self.schema: Dict[str, Any] = self._load_schema()
        self.entities: Dict[str, Any] = self.schema.get('entities', {})

        # NOTE: In a complete system, we would initialize the ViolationLogger here.
        # self.logger = ViolationLogger()
        
        if not self.entities:
            logger.warning(f"GICM Schema loaded but contains no entities: {schema_path}")

    def _load_schema(self) -> Dict[str, Any]:
        """Loads and validates the JSON schema file, raising critical errors on failure."""
        try:
            with open(self.schema_path, 'r') as f:
                schema = json.load(f)
            # Basic structural check
            if 'entities' not in schema or 'global_policies' not in schema:
                logger.error(f"Schema file is structurally incomplete: {self.schema_path}")
                raise RuntimeError(f"GICM setup failed: Schema missing core keys.")
            return schema
        except FileNotFoundError:
            logger.critical(f"GICM Schema file not found: {self.schema_path}")
            raise RuntimeError(f"GICM setup failed: Schema file missing.")
        except json.JSONDecodeError:
            logger.critical(f"GICM Schema file is invalid JSON: {self.schema_path}")
            raise RuntimeError(f"GICM setup failed: Invalid JSON schema.")

    def _validate_field_constraints(self, field_name: str, value: Any, props: Dict[str, Any]) -> List[str]:
        """Checks data type and specific constraints (e.g., format, enum) defined in the schema props."""
        field_violations = []
        
        expected_type = props.get('type')
        if expected_type and value is not None:
            # Type Check (Expanded type checks required for full compliance)
            if expected_type == 'string' and not isinstance(value, str):
                field_violations.append(f"Type mismatch: Field '{field_name}' must be a string (found {type(value).__name__}).")
            elif expected_type == 'integer' and not isinstance(value, int):
                field_violations.append(f"Type mismatch: Field '{field_name}' must be an integer (found {type(value).__name__}).")

        # Enumeration Check
        allowed_values = props.get('enum')
        if allowed_values and value is not None and value not in allowed_values:
            field_violations.append(f"Value violation: Field '{field_name}' value '{value}' is not permitted. Must be one of {allowed_values}.")
                     
        return field_violations

    def validate_entity(self, entity_name: str, record: Dict[str, Any]) -> Tuple[bool, List[Dict[str, Any]]]:
        """Validates a data record against its defined GICM entity schema.
        
        Returns: (success_bool, list_of_structured_violations)
        """
        if entity_name not in self.entities:
            return False, [{
                "code": "ENTITY_UNKNOWN", 
                "message": f"Unknown entity: {entity_name}", 
                "field": None
            }]
        
        entity_def = self.entities[entity_name]
        violations: List[Dict[str, Any]] = []

        # 1. Check Required Fields & Field Constraints
        for field, props in entity_def.get('fields', {}).items():
            is_present = field in record and record[field] is not None
            
            # Required Check
            if props.get('required') and not is_present:
                violations.append({"code": "MISSING_REQUIRED", "message": f"Missing required field: {field}", "field": field})
                continue

            if is_present:
                # Constraint Check
                field_violations = self._validate_field_constraints(field, record[field], props)
                for msg in field_violations:
                    violations.append({"code": "CONSTRAINT_VIOLATION", "message": msg, "field": field})
        
        # 2. Check Entity-Level Integrity Rules (e.g., Cross-field dependencies)
        # Hardcoded logic removed and implemented as a structured policy check
        if record.get('governance_level') == 'L5_Critical' and not record.get('audit_required_policy'):
            violations.append({
                "code": "GICM_L5_POLICY", 
                "message": "L5_Critical entities require 'audit_required_policy' linkage to be present for full audit trail.",
                "field": "audit_required_policy"
            })
                     
        # 3. Overall Integrity Model Assessment
        if violations and entity_def.get('integrity_model'):
            violations.insert(0, {
                "code": "INTEGRITY_COMPROMISED", 
                "message": f"Integrity model '{entity_def['integrity_model']}' requirements compromised due to structural errors.",
                "field": None
            })

        return not violations, violations

    def enforce_policy(self, violation_data: List[Dict[str, Any]], entity_name: str, record_identifier: str = "N/A"):
        """
        Triggers external enforcement hooks and logging based on violation data.
        It relies on the proposed ViolationLogger for structured persistence.
        """
        if not violation_data:
            return

        logger.warning(f"GICM Enforcement triggered for entity '{entity_name}'. Violations: {len(violation_data)}")
        
        # --- Hook Integration ---
        # Example: Trigger critical alert if core policy is violated
        is_critical = any(v['code'].startswith('GICM_L5') for v in violation_data)
        
        if is_critical:
            print(f"[CRITICAL ALERT HOOK]: Severe GICM policy violation detected in {entity_name} ({record_identifier}).")
            # Potential integration: trigger self.schema['global_policies']['critical_alert_hook']
        
        # NOTE: If ViolationLogger were integrated:
        # self.logger.log_violations(entity_name, record_identifier, violation_data)
