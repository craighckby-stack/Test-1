import json
from pydantic import BaseModel, Field, ValidationError
from typing import List, Literal, Optional, Dict, Any


class ProtocolValidationError(Exception):
    """Custom exception raised for FDLS Specification validation failures."""
    pass


# --- Pydantic Schemas ---

class SecurityConstraints(BaseModel):
    differential_privacy: Dict[str, Any]
    secure_aggregation: Dict[str, Any]
    auth_mechanism: Literal['mTLS', 'OAuth2', 'None'] = Field(description="Defines the required network authentication scheme.")


class WorkflowStep(BaseModel):
    step_name: str = Field(description="Unique identifier for the workflow stage.")
    roles: List[str]
    mandatory_fields: List[str] = Field(default_factory=list, description="Fields that must be present in messages for this step.")
    requires_security: bool = False
    requires_integrity_check: bool = False


class FDLSSpec(BaseModel):
    protocol_version: str = Field(pattern=r'^v\d+\.\d+$', description="The version of the FDLS standard implemented.")
    specification_id: str
    network_topology: Dict[str, Any]
    data_format_standard: Dict[str, Any]
    workflow: List[WorkflowStep]
    security_constraints: SecurityConstraints
    telemetry: Dict[str, Any]


class ProtocolValidator:
    """
    Validates an FDLS specification, enforcing both structural correctness (schema)
    and internal logical consistency (constraints).
    """

    def __init__(self, spec_source: Optional[str] = None, spec_data: Optional[Dict[str, Any]] = None):
        if spec_source:
            try:
                with open(spec_source, 'r') as f:
                    self.raw_data = json.load(f)
            except FileNotFoundError:
                raise ProtocolValidationError(f"Specification file not found at {spec_source}")
        elif spec_data:
            self.raw_data = spec_data
        else:
            raise ValueError("ProtocolValidator requires either spec_source path or raw spec_data dictionary.")

    def validate_spec(self) -> FDLSSpec:
        """
        Performs layered validation: Schema -> Logical Constraints.
        Raises ProtocolValidationError on failure.
        Returns the instantiated FDLSSpec model upon success.
        """
        # 1. Structural Validation (Pydantic Schema)
        try:
            spec_model = FDLSSpec(**self.raw_data)
        except ValidationError as e:
            raise ProtocolValidationError(f"Structural Schema Validation Error:\n{e}") from e

        # 2. Logical Constraint Validation
        self._validate_workflow_integrity(spec_model)

        print(f'FDLS Specification {spec_model.specification_id} validated successfully (Version: {spec_model.protocol_version}).')
        return spec_model

    def _validate_workflow_integrity(self, spec: FDLSSpec):
        """
        Enforces complex constraints that Pydantic models alone cannot cover.
        """
        workflow_names = {step.step_name for step in spec.workflow}

        if not workflow_names:
            raise ProtocolValidationError("Workflow must contain at least one step.")

        auth = spec.security_constraints.auth_mechanism

        for step in spec.workflow:
            if step.requires_security and auth == 'None':
                raise ProtocolValidationError(
                    f"Workflow step '{step.step_name}' requires security (requires_security=True) "
                    "but the global security constraints define 'auth_mechanism': 'None'."
                )
            
        return True

# Example usage (commented out):
# try:
#     # Assume 'protocol/fdls_spec.json' exists for initialization based on original path
#     # validator = ProtocolValidator(spec_source='protocol/fdls_spec.json')
#     # validated_spec = validator.validate_spec()
# except (ProtocolValidationError, ValueError) as e:
#     # Handle validation or initialization error
#     # print(e)
#     pass
