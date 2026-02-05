# utilities/configuration_schema_validator.py

import os
import yaml
import json
from jsonschema import validate, ValidationError

# --- Custom Exception Hierarchy ---

class ConfigurationError(Exception):
    """Base exception for configuration related issues (loading/mapping)."""
    pass

class SchemaNotFoundError(ConfigurationError):
    """Raised when a required schema file or mapping is unavailable."""
    pass

class ConfigurationFileError(ConfigurationError):
    """Raised when the configuration file cannot be read or parsed."""
    pass

# ----------------------------------

class ConfigurationSchemaValidator:
    """ 
    Enforces GAX governance standards by validating all core configuration 
    artifacts against defined JSON schemas using a centralized master index.
    """
    
    # Supported file types and their loading functions
    LOADERS = {
        '.json': json.load,
        '.yaml': yaml.safe_load,
        '.yml': yaml.safe_load,
    }

    def __init__(self, gax_master_spec_path: str):
        """
        Initializes the validator by loading the centralized schema index.
        """
        if not os.path.exists(gax_master_spec_path):
            raise FileNotFoundError(
                f"[GAX Integrity Failure] Master Spec index not found at {gax_master_spec_path}"
            )
            
        try:
            with open(gax_master_spec_path, 'r') as f:
                # Assuming the index maps artifact names to schema file paths
                self.gax_master_schema_index = yaml.safe_load(f)
        except Exception as e:
            raise ConfigurationFileError(f"Failed to load GAX Master Schema Index: {e}")

        # Infer the schema root directory from the master index location
        self.schema_directory = os.path.dirname(gax_master_spec_path)

    def _get_schema(self, artifact_name: str) -> dict:
        """
        Retrieves the specific validation schema based on the artifact's logical name.
        """
        schema_path_relative = self.gax_master_schema_index.get(artifact_name, None)
        
        if not schema_path_relative:
            raise SchemaNotFoundError(f"Artifact type '{artifact_name}' not mapped in GAX Master Spec index.")
            
        full_path = os.path.join(self.schema_directory, schema_path_relative)
        
        try:
            # Use yaml.safe_load for robustness against both JSON and YAML schemas
            with open(full_path, 'r') as f:
                schema_content = yaml.safe_load(f)
                if not isinstance(schema_content, dict):
                    raise ValueError("Schema content is malformed or empty.")
                return schema_content
        except FileNotFoundError:
            raise SchemaNotFoundError(
                f"Schema file defined for '{artifact_name}' not found at {full_path}"
            )
        except Exception as e:
            raise ConfigurationFileError(f"Error loading schema file {full_path}: {e}")


    def validate_configuration(self, config_artifact_path: str, artifact_name: str) -> bool:
        """
        Validates a specific configuration artifact against its predefined schema.
        
        Args:
            config_artifact_path: Full path to the configuration file (e.g., config.yaml).
            artifact_name: The conceptual name used for schema lookup (e.g., 'telemetry_spec').
            
        Raises:
            ValidationError: If the configuration violates the schema structure.
            ConfigurationError: If loading or schema mapping fails.
        """
        
        # 1. Determine loader based on file extension
        _, ext = os.path.splitext(config_artifact_path)
        loader = self.LOADERS.get(ext.lower())

        if not loader:
            raise ConfigurationFileError(
                f"Unsupported configuration file extension: {ext} at {config_artifact_path}"
            )

        # 2. Load Configuration Data
        try:
            with open(config_artifact_path, 'r') as f:
                config_data = loader(f)
        except Exception as e:
            raise ConfigurationFileError(
                f"Failed to load/parse artifact {config_artifact_path} as {ext} file: {e}"
            ) from e

        # 3. Retrieve Schema
        schema = self._get_schema(artifact_name) # Raises SchemaNotFoundError/ConfigurationFileError
        
        # 4. Perform Validation
        print(f"[CSV] Attempting validation for '{artifact_name}' (Path: {config_artifact_path})...")
        
        try:
            validate(instance=config_data, schema=schema)
            print(f"[CSV Success] Artifact {config_artifact_path} is conformant.")
            return True
            
        except ValidationError as e:
            # Re-raise with high-context, compliance-signaled message (P-M02: Validation Failure)
            raise ValidationError(
                f"[CSV FAILURE - P-M02/G0] Integrity Exhaustion: Validation Failed for {config_artifact_path} "
                f"(Artifact: {artifact_name}). Error: {e.message}"
            ) from e

# Note: This component is mandatory for GSEP-C Gate G0 execution integrity check.