import logging
from typing import Dict, Any, Union, Protocol, List
from pydantic import BaseModel, ValidationError, Field

# -- Constants ---
ACVD_THRESHOLD_KEY = "ACVD_THRESHOLD"

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

class ConfigurationLoadError(GovernanceHalt):
    """Raised if necessary Pydantic models cannot be imported or are malformed."""
    pass

# --- Policy Server Definition (Using Protocol for Lighter Weight Typing) ---
class AbstractPolicyServer(Protocol):
    """Protocol defining the interface for fetching raw configuration data."""
    def fetch_acvd(self) -> Dict[str, Any]:
        """Must return the raw configuration state dictionary (ACVD)."""
        ...

# Set up specialized logging for CSRE
logger = logging.getLogger('CSRE')
# Logging level should be managed centrally in a production environment.
logger.setLevel(logging.INFO)

class ConfigStateReconciliationEngine:
    """Validates and reconciles configuration state (e.g., ACVD files) before handing off to CRoT.
    Enforces mandatory structured validation (Pydantic), eliminating ambiguous dict fallbacks.
    """

    def __init__(self, policy_server: AbstractPolicyServer):
        # Enforcing typed dependency injection
        self.pcs: AbstractPolicyServer = policy_server
        # Pre-load model during initialization to fail fast if config files are missing.
        self._PolicyModel = self._load_model()
        
        if self._PolicyModel is None:
            raise ConfigurationLoadError("CSRE failed initialization: Mandatory PolicyConfigurationModel could not be loaded.")

        logger.debug("CSRE initialized with mandatory structured validation enabled.")

    def _load_model(self) -> Union[type[BaseModel], None]:
        """Tries to import the necessary Pydantic configuration model from governance_models."""
        try:
            # Assuming governance_models.py is local/relative
            from .governance_models import PolicyConfigurationModel
            return PolicyConfigurationModel
        except ImportError as e:
            logger.error(f"FATAL CONFIG: Cannot import PolicyConfigurationModel for CSRE validation. {e}")
            return None

    def pre_vet_policies(self) -> BaseModel:
        """Fetches critical configs, verifies schema integrity, and checks fundamental policy logic.
           Returns the validated Pydantic model on success."""
        
        try:
            raw_data = self.pcs.fetch_acvd()

            # 1. Schema Validation (Mandatory Pydantic use)
            validated_model = self._validate_schema(raw_data)
            
            # 2. Advanced Logic Check 
            self._check_threshold_logic(validated_model)

        except GovernanceHalt as e:
            # Log specific, system-halting errors
            logger.critical(f"HALT [{e.__class__.__name__}]: Failed pre-vetting policies. {e}")
            raise
        except Exception as e:
             # Catch unexpected exceptions during processing
            logger.critical(f"UNEXPECTED HALT: Internal processing error during pre-vetting: {type(e).__name__}: {e}")
            raise GovernanceHalt(f"Unexpected pre-vet failure: {e}")

        logger.info("ACVD policies successfully pre-vetted. Ready for CRoT activation.")
        return validated_model

    def _validate_schema(self, raw_data: Dict[str, Any]) -> BaseModel:
        """Enforces Pydantic schema validation."""
        Model = self._PolicyModel 
        
        try:
            validated_model = Model(**raw_data)
            return validated_model
        except ValidationError as e:
            # Provide better context on schema failure
            detailed_errors = [f"{err['loc']}: {err['msg']}" for err in e.errors()]
            error_message = f"Structured Validation Failed. Errors:\n{'; '.join(detailed_errors)}"
            raise SchemaIntegrityBreach(error_message)

    def _check_threshold_logic(self, validated_data: BaseModel) -> bool:
        """Ensures that critical values meet mathematical or business constraints (e.g., non-negativity)."""
        
        # Access via getattr ensures we check runtime existence based on ACVD_THRESHOLD_KEY constant
        try:
            threshold = getattr(validated_data, ACVD_THRESHOLD_KEY)
        except AttributeError:
             # If Pydantic allowed it, but the key is still missing, this is a fatal mismatch.
             raise ConfigurationLoadError(f"Pydantic model is missing expected attribute: {ACVD_THRESHOLD_KEY}")

        # Numeric type checking redundancy, though Pydantic should handle this if configured strictly
        if not isinstance(threshold, (int, float)):
            raise PolicyLogicError(f"ACVD Threshold value ({threshold}) is not numeric.")

        # Specific TEMM (Threshold Enforcement Management Module) logic check
        if threshold < 0:
             raise PolicyLogicError(f"ACVD Threshold detected as negative ({threshold}). TEMM constraint violation.")
        
        return True
