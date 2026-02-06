import json
from jsonschema import validate, ValidationError
import os

class ChronologyValidator:
    """
    Utility class for validating Chronology Records (CHR) against the formal protocol schema.
    Ensures data integrity across the Sovereign AGI system's runtime history layer.
    """
    def __init__(self, schema_path="protocol/chr_schema.json"):
        if not os.path.exists(schema_path):
            raise FileNotFoundError(f"Required schema file not found at {schema_path}")
        try:
            with open(schema_path, 'r') as f:
                self.schema = json.load(f)
        except json.JSONDecodeError:
            raise RuntimeError(f"Failed to parse valid JSON schema at {schema_path}")
        
    def validate_record(self, record: dict) -> bool:
        """Validates a single Chronology Record against the schema."""
        try:
            validate(instance=record, schema=self.schema)
            return True
        except ValidationError as e:
            # High-priority alert: Chronology protocol breach detected.
            # Log detailed error information for immediate debugging/tracing.
            print(f"[CHR Protocol Error] Validation Failed on record: {e.message}")
            return False
