import json
from jsonschema import validate

# NOTE: Schema definition must be loaded dynamically.

class FDLSRuntimeValidator:
    def __init__(self, fdls_spec_path):
        with open(fdls_spec_path, 'r') as f:
            self.schema = json.load(f)['schema_definition']

    def validate_payload(self, payload):
        """Validates a raw FDLS payload against the formal schema_definition."""
        try:
            validate(instance=payload, schema=self.schema)
            return True, None
        except Exception as e:
            return False, str(e)

# Example usage initialization using the updated 'protocol/fdls_spec.json' path.