import os
import yaml
import json

class SchemaRegistryError(Exception):
    """Base error for schema registry operations."""
    pass

class SchemaRegistry:
    """
    Centralized immutable component for managing and retrieving versioned governance schemas.
    Decouples the configuration validator from schema storage implementation.
    """
    def __init__(self, registry_root_path: str):
        self.registry_root = registry_root_path
        if not os.path.isdir(self.registry_root):
            raise SchemaRegistryError(f"Registry root directory not found: {registry_root_path}")

    def get_schema(self, artifact_name: str, version: str = 'latest') -> dict:
        """
        Retrieves a specific schema by artifact name and version.
        
        The expected file structure is: 
        <registry_root>/<artifact_name>/<version>/schema.yaml
        """
        schema_path = os.path.join(
            self.registry_root, 
            artifact_name.lower(), 
            version, 
            'schema.yaml'
        )

        if not os.path.exists(schema_path):
            raise SchemaRegistryError(
                f"Schema {artifact_name} v{version} not found at {schema_path}"
            )
        
        try:
            with open(schema_path, 'r') as f:
                # Use yaml.safe_load as schemas are often stored as YAML/JSON
                return yaml.safe_load(f)
        except Exception as e:
            raise SchemaRegistryError(f"Failed to load schema file {schema_path}: {e}")