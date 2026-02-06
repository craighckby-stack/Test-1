import json
from pydantic import BaseModel, Field, ValidationError
from typing import List, Literal, Optional

# Dynamic Pydantic Schemas generated from the spec structure
class SecurityConstraints(BaseModel):
    differential_privacy: dict
    secure_aggregation: dict
    auth_mechanism: Literal['mTLS', 'OAuth2']

class WorkflowStep(BaseModel):
    step_name: str
    roles: List[str]
    mandatory_fields: List[str] = Field(default_factory=list)
    requires_security: bool = False
    requires_integrity_check: bool = False

class FDLSSpec(BaseModel):
    protocol_version: str
    specification_id: str
    network_topology: dict
    data_format_standard: dict
    workflow: List[WorkflowStep]
    security_constraints: SecurityConstraints
    telemetry: dict

class ProtocolValidator:
    def __init__(self, spec_path: str = 'protocol/fdls_spec.json'):
        with open(spec_path, 'r') as f:
            self.spec_data = json.load(f)

    def validate_spec(self):
        """Validates the specification file against the defined schema."""
        try:
            FDLSSpec(**self.spec_data)
            print('FDLS Specification validated successfully.')
            return True
        except ValidationError as e:
            print(f'FDLS Specification Validation Error:\n{e}')
            return False

# Example usage:
# validator = ProtocolValidator()
# validator.validate_spec()
