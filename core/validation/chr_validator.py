import json
import logging
from jsonschema import validate, ValidationError
from pathlib import Path

# Initialize module logger for robust error tracking
logger = logging.getLogger(__name__)

class ChronologyValidator:
    """
    Utility class for validating Chronology Records (CHR) against the formal protocol schema.
    Ensures data integrity across the Sovereign AGI system's runtime history layer.
    
    Refactored to use standard logging and pathlib for robustness.
    """
    
    # Use a class-level constant for the default path, improving discoverability
    DEFAULT_SCHEMA_PATH = "protocol/chr_schema.json"

    def __init__(self, schema_path: str = None):
        # Use pathlib for modern, cross-platform path handling
        schema_file_path = Path(schema_path or self.DEFAULT_SCHEMA_PATH)
        
        if not schema_file_path.exists():
            error_msg = f"Required CHR schema file not found at {schema_file_path.resolve()}"
            logger.critical(error_msg)
            raise FileNotFoundError(error_msg)
        
        try:
            with open(schema_file_path, 'r', encoding='utf-8') as f:
                self.schema = json.load(f)
            logger.info(f"ChronologyValidator initialized successfully using schema: {schema_file_path}")
        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse valid JSON schema at {schema_file_path}: {e}"
            logger.critical(error_msg)
            raise RuntimeError(error_msg)
        
    def validate_record(self, record: dict) -> bool:
        """Validates a single Chronology Record against the schema."""
        if not isinstance(record, dict):
            logger.warning(f"Validation skipped: Input is not a dictionary ({type(record)}) starting with {str(record)[:50]}")
            return False
            
        try:
            validate(instance=record, schema=self.schema)
            return True
        except ValidationError as e:
            # High-priority alert: Chronology protocol breach detected.
            # Log detailed error information for tracing critical integrity failures.
            record_id = record.get('uuid', record.get('timestamp', 'UNKNOWN'))
            
            logger.error(
                f"[CHR Protocol Breach] Validation failed on record '{record_id}'. "
                f"Error: {e.message}. Schema path: {list(e.path)}"
            )
            return False
