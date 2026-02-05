# utilities/configuration_schema_validator.py

import os
import yaml
import json
from jsonschema import validate, ValidationError

class ConfigurationSchemaValidator:
    """Enforces GAX (New) by validating all core governance configuration artifacts 
    against defined schemas prior to GSEP-C Gate G0. """
    
    def __init__(self, gax_master_spec_path):
        self.gax_master_spec_path = gax_master_spec_path
        with open(gax_master_spec_path, 'r') as f:
            self.gax_master_schema = yaml.safe_load(f)

    def _load_artifact_schema(self, schema_path):
        # Schema definitions are referenced within gax_master_schema
        # In a production system, this retrieves the specific required schema.
        # Mock retrieval for concept:
        if 'telemetry' in schema_path:
            # Example mock schema retrieval
            return {"type": "object", "properties": {"id": {"type": "string"}} }
        return None

    def validate_configuration(self, config_artifact_path, artifact_type):
        """Validates a specific configuration artifact against its schema."""
        print(f"[CSV] Validating artifact: {config_artifact_path}")
        
        schema = self._load_artifact_schema(config_artifact_path)
        if not schema:
            raise ValueError(f"No defined schema found for path: {config_artifact_path}")

        try:
            with open(config_artifact_path, 'r') as f:
                if artifact_type == 'json':
                    config_data = json.load(f)
                elif artifact_type == 'yaml':
                    config_data = yaml.safe_load(f)
                else:
                    raise ValueError("Unsupported artifact type.")

            validate(instance=config_data, schema=schema)
            print(f"[CSV Success] Artifact {config_artifact_path} is conformant.")
            return True
            
        except (FileNotFoundError, ValueError, ValidationError) as e:
            print(f"[CSV FAILURE - P-M02] Integrity Exhaustion due to config validation failure: {e}")
            # In a real system, this would signal FSMU/PIM immediately
            return False

# Note: Integration requires CSV execution before EMSU at G0.
