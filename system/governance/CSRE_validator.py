import logging
from typing import Dict, Any, TYPE_CHECKING, Union
from pydantic import BaseModel, ValidationError

# Define structured exceptions early for precise error tracking
class GovernanceHalt(Exception):
    """Base exception for reconciliation failures, preventing CRoT activation."""
    pass

class SchemaIntegrityBreach(GovernanceHalt):
    """Raised when ACVD structure fails Pydantic schema validation."""
    pass

class PolicyLogicError(GovernanceHalt):
    """Raised when validated data violates critical logical constraints (e.g., negative metrics)."""
    pass

# Ensure AbstractPolicyServer is defined for robust type checking
if TYPE_CHECKING:
    class AbstractPolicyServer:
        def fetch_acvd(self) -> Dict[str, Any]:
            ...

# Set up specialized logging for CSRE
logger = logging.getLogger('CSRE')
# In a proper system, this would be configured externally, setting minimal level for this utility
logger.setLevel(logging.INFO)

class ConfigStateReconciliationEngine:
    """Validates and reconciles configuration state (e.g., ACVD files) before handing off to CRoT.
    Shifts policy failure risk left of P1 using structured validation, maximizing pipeline efficiency."""

    def __init__(self, policy_server: 'AbstractPolicyServer'):
        # Enforcing typed dependency injection
        self.pcs = policy_server
        logger.debug("CSRE initialized.")

    def pre_vet_policies(self) -> bool:
        """Fetches critical configs, verifies schema integrity, and checks fundamental policy logic."""
        
        try:
            raw_data = self.pcs.fetch_acvd()

            # 1. Schema Validation (Uses external Pydantic model for rigor)
            validated_model = self._validate_schema(raw_data)
            
            # 2. Advanced Logic Check 
            self._check_threshold_logic(validated_model)

        except GovernanceHalt as e:
            # Catch specialized governance errors and log critically before re-raising
            logger.critical(f"HALT [{e.__class__.__name__}]: Failed pre-vetting.")
            raise

        logger.info("ACVD policies successfully pre-vetted. Ready for CRoT activation.")
        return True

    def _get_model(self):
        """Helper to conditionally import the required configuration model."""
        try:
            # Assuming governance_models.py is sibling/sibling-relative to CSRE_validator.py
            from .governance_models import PolicyConfigurationModel
            return PolicyConfigurationModel
        except ImportError as e:
            logger.error(f"Cannot import PolicyConfigurationModel. Structured validation disabled. {e}")
            return None
        
    def _validate_schema(self, raw_data: Dict[str, Any]) -> Union[BaseModel, Dict[str, Any]]:
        """Uses Pydantic model if available, otherwise performs minimal dictionary check."""
        Model = self._get_model()
        if Model:
            try:
                # Pydantic validation enforcement
                validated_model = Model(**raw_data)
                return validated_model
            except ValidationError as e:
                raise SchemaIntegrityBreach(f"Structured Validation Failed: {e}")
        else:
            # Fallback for resilience if model file is missing or Pydantic failed
            if not (isinstance(raw_data, dict) and 'ACVD_THRESHOLD' in raw_data): # Note: Refactored key name to use underscore standard
                raise SchemaIntegrityBreach("Minimal validation failed: data structure or essential key missing.")
            return raw_data

    def _check_threshold_logic(self, validated_data: Union[BaseModel, Dict[str, Any]]) -> bool:
        """Ensures that critical values meet mathematical or business constraints (e.g., non-negativity)."""
        
        # Determine the threshold value irrespective of whether it's a model or a raw dict
        if isinstance(validated_data, BaseModel):
            # Access attribute directly
            threshold = validated_data.ACVD_THRESHOLD
        elif isinstance(validated_data, dict):
            # Use dictionary access (using original refactored key)
            threshold = validated_data.get('ACVD_THRESHOLD', 0)
        else:
             # Should not happen if _validate_schema ran correctly
             threshold = 0

        if threshold < 0:
             # Raises specific, traceable exception instead of generic ValueError
             raise PolicyLogicError(f"ACVD Threshold detected as negative ({threshold}). TEMM constraint violation.")
        
        return True
