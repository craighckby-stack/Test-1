# VMO/SPDM_Integrity_Validator.py
import json
from datetime import datetime

class SPDMIntegrityValidator:
    """
    Ensures incoming risk metric payloads (SPDM inputs) strictly adhere 
    to the VMO requirement schema (v2.0.0) before calculation starts.
    """
    def __init__(self, schema_path='config/SPDM_Schema.json'):
        # Dynamically loads the schema to enforce real-time adherence
        try:
            with open(schema_path, 'r') as f:
                self.schema = json.load(f)
        except FileNotFoundError:
            # Enhanced robustness: Handle missing schema gracefully
            print(f"CRITICAL: SPDM Schema not found at {schema_path}. Using empty definition.")
            self.schema = {'metrics': []}
            
        self.metric_defs = {m['id']: m for m in self.schema.get('metrics', [])}
        self.required_metrics = set(self.metric_defs.keys())
        self.schema_path = schema_path

    def validate(self, payload: dict) -> dict:
        """
        Validates the incoming data structure, type, and required fields.
        Returns {'is_valid': bool, 'errors': list} for structured feedback.
        """
        errors = []
        
        # 1. Structural Validation
        if 'timestamp' not in payload:
            errors.append({'code': 'STRUCT_MISSING', 'field': 'timestamp', 'message': "Payload missing mandatory 'timestamp' key."})
        if 'metrics' not in payload:
            errors.append({'code': 'STRUCT_MISSING', 'field': 'metrics', 'message': "Payload missing mandatory 'metrics' dictionary."})

        if 'timestamp' in payload:
            try:
                # Use strict ISO format check
                datetime.fromisoformat(payload['timestamp'].replace('Z', '+00:00'))
            except (ValueError, TypeError):
                errors.append({'code': 'TYPE_INVALID', 'field': 'timestamp', 'value': payload.get('timestamp'), 'message': "Invalid timestamp format (must be ISO 8601)."})

        # Skip metric checks if core structure is fundamentally broken or metrics key is absent
        if not payload.get('metrics') or 'metrics' in errors:
            return {'is_valid': not bool(errors), 'errors': errors}

        incoming_metric_ids = set(payload['metrics'].keys())
        
        # 2. Metric Existence Check
        missing = self.required_metrics - incoming_metric_ids
        if missing:
            errors.append({'code': 'METRIC_MISSING', 'metrics': sorted(list(missing)), 'message': f"Payload missing required SPDM metrics: {list(missing)}"})

        # 3. Type Validation
        for mid, value in payload['metrics'].items():
            if mid not in self.metric_defs:
                # Allows extra metrics if robust filtering is implemented later
                continue 

            definition = self.metric_defs[mid]
            expected_type = definition['type']
            value_type = type(value).__name__

            is_valid_type = True

            if expected_type == 'float':
                # Accepts int as float for convenience
                if not isinstance(value, (float, int)):
                    is_valid_type = False
            elif expected_type == 'integer':
                # Must be strictly an integer
                if not isinstance(value, int):
                    is_valid_type = False
            
            if not is_valid_type:
                errors.append({
                    'code': 'TYPE_MISMATCH', 
                    'metric': mid, 
                    'expected': expected_type, 
                    'received': value_type,
                    'message': f"Metric {mid} requires {expected_type}, got {value_type}"
                })
            
        return {'is_valid': not bool(errors), 'errors': errors}

    def get_validated_data(self, payload: dict) -> dict:
        """ Returns the payload if valid, raising a consolidated exception otherwise. """
        validation_result = self.validate(payload)
        
        if not validation_result['is_valid']:
            # Consolidate all errors into one message for high-level reporting
            error_summary = [f"{e.get('code', 'UNKNOWN')}: {e.get('message', 'Validation error')}" for e in validation_result['errors']]
            raise ValueError(f"SPDM Payload Validation Failed ({len(error_summary)} errors found):\n" + "\n".join(error_summary))
            
        return payload

# EOF