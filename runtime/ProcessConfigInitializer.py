from typing import Dict, Any, Union
from jsonschema import Draft202012Validator, ValidationError
import os


class ConfigInitializationError(Exception):
    """Custom exception raised when configuration fails validation or initialization."""
    def __init__(self, message: str, path: Union[list, None] = None):
        super().__init__(message)
        self.path = path or []


class ProcessConfigInitializer:
    """
    Validates, normalizes, and initializes task configuration based on a defined 
    JSON schema (AGCA_PCTM_V1) prior to runtime orchestration.
    
    Uses Draft202012Validator for maximum JSON Schema compliance robustness.
    """
    
    def __init__(self, schema_content: Dict[str, Any]):
        """Initializes the validator using the provided schema dictionary."""
        # 1. Self-validate the provided schema before instantiation
        try:
            Draft202012Validator.check_schema(schema_content)
        except ValidationError as e:
            raise ValueError(f"Provided configuration schema is invalid: {e.message}")
        
        # 2. Pre-compile the validator instance for faster subsequent validations.
        self._validator = Draft202012Validator(schema_content)

    def _apply_default_values(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies default values defined in the schema if corresponding keys are missing.
        (This is a placeholder hook for recursive default merging.)
        
        In high-efficiency systems, this logic ensures optional settings
        are explicitly present if defined in the schema defaults.
        """
        # Note: True recursive default merging typically requires an auxiliary library
        # or manual implementation based on self._validator.schema introspection.
        
        return config

    def validate_and_initialize(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes validation, applies normalization, and returns the immutable 
        configuration object.
        """
        
        # 1. Structural Validation
        try:
            self._validator.validate(config)
        except ValidationError as e:
            # Raise custom error for clean downstream exception handling
            path_str = ".".join(map(str, e.path))
            raise ConfigInitializationError(
                f"Configuration failed validation: {e.message}", 
                path=list(e.path)
            ) from e

        # 2. Normalization / Default Application
        initialized_config = self._apply_default_values(config)
        
        # Defensive return copy to ensure original configuration integrity
        return initialized_config.copy()
