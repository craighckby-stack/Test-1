from pathlib import Path
from typing import List, Optional

# NOTE: In a production system, this component should leverage a robust library
# like 'packaging.version' or 'semver' for accurate comparison, but for scaffolding
# we rely on basic string/numeric comparison of version parts.

class SchemaVersionResolverError(Exception):
    """Error specific to version resolution failures."""
    pass

class SchemaVersionResolver:
    """
    Utility component to scan artifact directories and resolve abstract version requests
    (e.g., 'latest', '2.x.x') to the highest available concrete directory version.
    """
    
    @staticmethod
    def _is_version_like(dir_name: str) -> bool:
        """Basic heuristic check for directories that look like versions."""
        return any(c.isdigit() for c in dir_name)

    @staticmethod
    def find_latest_numeric_version(artifact_dir: Path) -> Optional[str]:
        """
        Scans an artifact directory and returns the highest available semantic version string.
        Assumes directories are named using standard semantic versioning (X.Y.Z).
        """
        if not artifact_dir.is_dir():
            return None

        version_strings = []
        for item in artifact_dir.iterdir():
            if item.is_dir() and SchemaVersionResolver._is_version_like(item.name):
                version_strings.append(item.name)

        if not version_strings:
            return None
            
        # Simple comparison based on standard python sorting of version parts (X.Y.Z)
        # Requires stable SemVer format for correct ordering.
        return sorted(version_strings, key=lambda v: [int(x) if x.isdigit() else x for x in v.split('.')])[-1]

    @classmethod
    def resolve_version(cls, artifact_dir: Path, requested_version: str) -> str:
        """
        Resolves the requested version.
        If requested_version is 'latest' and a literal 'latest' folder is not present,
        it attempts to find the highest numeric version.
        """
        if requested_version == 'latest':
            # 1. Check for literal 'latest' directory (e.g., symlink)
            if (artifact_dir / 'latest').is_dir():
                return 'latest'
            
            # 2. Find highest numeric version if 'latest' is not a dir
            highest_version = cls.find_latest_numeric_version(artifact_dir)
            if highest_version:
                return highest_version
            
            raise SchemaVersionResolverError(
                f"Could not resolve 'latest' version for artifact in {artifact_dir}."
            )

        # 3. For explicit requests, just return the request (SchemaRegistry will handle file check)
        return requested_version
