import os
import threading
from pathlib import Path
import yaml
from typing import Dict, Any, Optional
from collections import defaultdict
from yaml import YAMLError

# NOTE: This dependency relies on the proposed 'utilities/semver_utility.py' scaffold.
# If the utility is not yet present, a simple fallback version sorter is defined.
try:
    from utilities.semver_utility import get_latest_version
except ImportError:
    # Fallback function for non-SemVer-aware version sorting
    def get_latest_version(versions):
        versions.sort(reverse=True)
        return versions[0] if versions else None

class SchemaRegistryError(Exception):
    """Base error for schema registry operations."""
    pass

class SchemaRegistry:
    """
    Centralized component for managing and retrieving versioned governance schemas.
    Uses pathlib for robust path handling, implements in-memory caching with 
    thread-safe access, and intelligently resolves the latest version.
    """
    
    # Internal cache structure: {artifact_name: {version: schema_dict}}
    _cache: Dict[str, Dict[str, Dict[str, Any]]]
    _cache_lock: threading.Lock

    def __init__(self, registry_root_path: str):
        # Use Path for cleaner path operations and ensure absolute path resolution
        self.registry_root = Path(registry_root_path).resolve()
        
        if not self.registry_root.is_dir():
            raise SchemaRegistryError(f"Registry root directory not found: {registry_root_path}")
            
        # Use defaultdict for cleaner cache insertion logic
        self._cache = defaultdict(dict)
        # Introduce a lock for thread-safe access to the cache
        self._cache_lock = threading.Lock()
        
    def _get_schema_path(self, artifact_name: str, version: str) -> Path:
        """Helper to construct the canonical path."""
        # Standardize artifact name to lowercase for file system paths
        standardized_name = artifact_name.lower()
        
        # Structure: <registry_root>/<artifact_name>/<version>/schema.yaml
        return self.registry_root / standardized_name / version / 'schema.yaml'

    def get_schema(self, artifact_name: str, version: str = 'latest') -> dict:
        """
        Retrieves a specific schema by artifact name and version.
        Caches the schema on successful load, handling concurrency safely.
        """
        
        # 1. Check Cache (Thread-Safe Read)
        with self._cache_lock:
            artifact_cache = self._cache.get(artifact_name)
            # Python 3.8+ walrus operator used for cleaner cache lookup
            if artifact_cache and (schema := artifact_cache.get(version)):
                return schema

        # 2. Resolve Path & Load
        try:
            schema_path = self._get_schema_path(artifact_name, version)
            schema_data = self._load_schema_file(schema_path)
        
        except FileNotFoundError:
            # If the literal path fails, try robust 'latest' resolution
            if version == 'latest':
                resolved_version = self._find_latest_version(artifact_name)
                
                if resolved_version:
                    # Recursive call to load and cache the canonical latest version
                    return self.get_schema(artifact_name, resolved_version)
            
            # Final failure point
            raise SchemaRegistryError(
                f"Schema '{artifact_name}' v'{version}' not found. "
                f"Attempted path: {schema_path}"
            )

        # 3. Store Cache (Thread-Safe Write)
        with self._cache_lock:
            self._cache[artifact_name][version] = schema_data
        
        return schema_data

    def _load_schema_file(self, path: Path) -> dict:
        """Handles I/O and parsing of the schema file, with detailed error handling."""
        try:
            content = path.read_text(encoding='utf-8')
            return yaml.safe_load(content)
        except FileNotFoundError:
            # Let the caller (get_schema) handle the missing file, especially for 'latest' resolution
            raise
        except YAMLError as e:
            # Specific YAML parsing failure
            raise SchemaRegistryError(f"Failed to parse schema file {path} due to YAML error: {e}")
        except IOError as e:
            # General I/O errors (e.g., permissions)
            raise SchemaRegistryError(f"Failed to read schema file {path} due to I/O error: {e}")
        except Exception as e:
            # Catch unexpected errors during parsing/reading
            raise SchemaRegistryError(f"Unexpected error processing schema file {path}: {type(e).__name__} - {e}")
            
    def _find_latest_version(self, artifact_name: str) -> Optional[str]:
        """
        Intelligently determines the highest valid version for an artifact by 
        scanning directories and utilizing robust version sorting (via get_latest_version).
        """
        artifact_root = self.registry_root / artifact_name.lower()
        
        if not artifact_root.is_dir():
            return None

        # Gather directories that contain a schema.yaml file (valid versions)
        valid_version_candidates = []
        for d in artifact_root.iterdir():
            if d.is_dir() and (d / 'schema.yaml').is_file():
                valid_version_candidates.append(d.name)
        
        if not valid_version_candidates:
            return None

        # Use the utility to find the canonical latest version
        return get_latest_version(valid_version_candidates)
