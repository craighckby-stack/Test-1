import json
from jsonschema import validate, ValidationError

class AGCA_SchemaValidator:
    def __init__(self, schema_path="schema/AGCA_PCTM_V2.json"):
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)

    def validate_request(self, data: dict, definition_key: str = "ExecutionRequest") -> bool:
        """Validates data against a specific definition within the main schema."""
        if definition_key not in self.schema['properties']:
            raise ValueError(f"Definition key '{definition_key}' not found in schema.")

        temp_schema = {
            "$schema": self.schema.get('$schema'),
            "$id": self.schema.get('$id'),
            "type": "object",
            "properties": {definition_key: self.schema['properties'][definition_key]},
            "required": [definition_key]
        }

        # Wrap the data temporarily to match the validation schema structure
        wrapped_data = {definition_key: data}

        try:
            validate(instance=wrapped_data, schema=temp_schema)
            return True
        except ValidationError as e:
            print(f"Validation Error: {e.message}")
            return False

    def normalize_request(self, data: dict) -> dict:
        """Placeholder for normalization/defaulting logic, ensuring constraints are met."""
        # Logic here would apply defaults from ControlPlaneConstraints if missing, etc.
        return data

# Example usage not included in production code.
