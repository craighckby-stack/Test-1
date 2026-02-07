import json
import hashlib
import logging
from typing import Dict, Any, Tuple, Optional

# Configure a default logger (should ideally be imported from utils/system_logger)
logging.basicConfig(
    level=logging.INFO,
    format='[DSE_VALIDATOR] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_MANIFEST_PATH = 'config/dse_schema_manifest.json'

class SchemaIntegrityValidator:
    """
    Validates the integrity of Data Schema Evolution (DSE) files against 
    a known manifest and plans necessary migrations.
    """

    def __init__(self, manifest_path: str = DEFAULT_MANIFEST_PATH):
        self.manifest_path = manifest_path

    @staticmethod
    def _calculate_checksum(file_path: str) -> Optional[str]:
        """Calculates SHA256 checksum for a given file."""
        hasher = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                # Optimized read operation
                for chunk in iter(lambda: f.read(4096), b''):
                    hasher.update(chunk)
            return 'sha256:' + hasher.hexdigest()
        except FileNotFoundError:
            return None
        except IOError as e:
            logger.error(f"Error reading file {file_path}: {e}")
            return None

    def load_manifest(self) -> Dict[str, Any]:
        """Loads the DSE manifest file."""
        logger.info(f"Loading manifest from {self.manifest_path}")
        try:
            with open(self.manifest_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.critical(f"Manifest file not found at {self.manifest_path}.")
            raise
        except json.JSONDecodeError:
            logger.critical(f"Manifest file is malformed JSON: {self.manifest_path}.")
            raise

    def validate_and_plan(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Performs integrity checks and generates a structured migration plan.
        Returns: (integrity_ok, migration_plan_report)
        """
        try:
            manifest = self.load_manifest()
        except Exception:
            return False, {'status': 'SETUP_FAILURE', 'integrity_check': False, 'critical_errors': ["Failed to load or parse schema manifest."]}

        integrity_ok = True
        migration_plan = {
            'status': 'READY',
            'integrity_check': True,
            'required_migrations': [],
            'warnings': [],
            'critical_errors': []
        }

        for schema in manifest.get('schemas', []):
            name = schema.get('name', 'UNKNOWN_SCHEMA')
            expected_checksum = schema.get('checksum')
            file_path = schema.get('path')
            strategy = schema.get('evolution_strategy', 'none')
            status = schema.get('status', 'Active')

            # 1. Integrity Check
            actual_checksum = self._calculate_checksum(file_path)
            
            if not actual_checksum:
                msg = f"Schema {name}: File not found at {file_path}. Cannot verify integrity."
                logger.error(msg)
                integrity_ok = False
                migration_plan['critical_errors'].append(msg)
                continue
            
            if actual_checksum != expected_checksum:
                # Truncate checksum display for cleaner logging
                msg = (f"Schema {name}: Checksum mismatch. Expected {expected_checksum[:10]}..., "
                       f"Found {actual_checksum[:10]}...")
                logger.critical(msg)
                integrity_ok = False
                migration_plan['critical_errors'].append(msg)
            else:
                logger.info(f"Schema {name}: Integrity verified.")

            # 2. Migration Planning
            migration_data = {
                'schema': name,
                'path': file_path,
                'strategy': strategy
            }

            if status == 'Deprecated' or 'migration' in strategy:
                migration_plan['required_migrations'].append(migration_data)
                logger.warning(f"Schema {name} marked for mandatory migration/deprecation processing.")
            
            if strategy == 'requires_atomic_swap':
                 migration_plan['warnings'].append(f"Schema {name} requires specialized deployment tooling (Atomic Swap).")
            
        
        migration_plan['integrity_check'] = integrity_ok
        if not integrity_ok:
            migration_plan['status'] = 'CRITICAL_FAILURE'
        elif migration_plan['required_migrations']:
             migration_plan['status'] = 'MIGRATION_REQUIRED'
        else:
             migration_plan['status'] = 'VERIFIED_ACTIVE'

        if integrity_ok and not migration_plan['required_migrations']:
             logger.info("All schema files verified. No migrations planned.")

        return integrity_ok, migration_plan

if __name__ == '__main__':
    # Note: Execution logic moved out of the function and utilizes the new class structure.
    validator = SchemaIntegrityValidator()
    validation_status, plan = validator.validate_and_plan()
    
    print("\n--- FINAL DSE MIGRATION REPORT ---")
    print(json.dumps(plan, indent=2))
    print(f"\nSystem Integrity Check Passed: {validation_status}")
