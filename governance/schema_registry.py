import os
from pathlib import Path
import yaml
from typing import Dict, Any, Optional

class SchemaRegistryError(Exception):
    """Base error for schema registry operations."""
    pass

class SchemaRegistry:
    """
    Centralized component for managing and retrieving versioned governance schemas.
    Uses pathlib for robust path handling and implements in-memory caching for performance.
    Decouples the configuration validator from schema storage implementation.
    """
    
    # Internal cache structure: {artifact_name: {version: schema_dict}}
    _cache: Dict[str, Dict[str, Dict[str, Any]]]

    def __init__(self, registry_root_path: str):
        # Use Path for cleaner path operations and ensure absolute path resolution
        self.registry_root = Path(registry_root_path).resolve()
        
        if not self.registry_root.is_dir():
            raise SchemaRegistryError(f"Registry root directory not found: {registry_root_path}")
            
        self._cache = {}
        
    def _get_schema_path(self, artifact_name: str, version: str) -> Path:
        """Helper to construct the canonical path."""
        # Standardize artifact name to lowercase for file system paths
        standardized_name = artifact_name.lower()
        
        # Structure: <registry_root>/<artifact_name>/<version>/schema.yaml
        return self.registry_root / standardized_name / version / 'schema.yaml'

    def get_schema(self, artifact_name: str, version: str = 'latest') -> dict:
        """
        Retrieves a specific schema by artifact name and version.
        Caches the schema on successful load.
        
        The expected file structure is: 
        <registry_root>/<artifact_name>/<version>/schema.yaml
        """
        
        # 1. Check Cache
        artifact_cache = self._cache.get(artifact_name)
        if artifact_cache:
            schema = artifact_cache.get(version)
            if schema is not None:
                return schema

        # 2. Resolve Path
        schema_path = self._get_schema_path(artifact_name, version)

        if not schema_path.is_file():
            raise SchemaRegistryError(
                f"Schema {artifact_name} v{version} not found. Expected path: {schema_path}"
            )
        
        # 3. Load Schema
        try:
            # Pathlib handles opening and closing files efficiently
            content = schema_path.read_text(encoding='utf-8')
            schema_data = yaml.safe_load(content)
            
        except Exception as e:
            raise SchemaRegistryError(f"Failed to load and parse schema file {schema_path}: {e}")
        
        # 4. Store Cache and Return
        if artifact_name not in self._cache:
            self._cache[artifact_name] = {}
        
        self._cache[artifact_name][version] = schema_data
        
        return schema_data
