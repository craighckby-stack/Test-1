import json
import re
from typing import Dict, Any, List, Tuple, Union

class ProposalSchemaValidator:
    """Utility for rigorously validating SST payloads against the PPC contract (PPC-V2.0 schema)."""
    
    # Centralized mapping of schema type strings to native Python types
    TYPE_MAP: Dict[str, Union[type, Tuple[type, ...]]] = {
        "string": str,
        "number": (int, float),
        "boolean": bool,
        "object": dict,
        "array": list,
    }

    def __init__(self, contract_data: Dict[str, Any]):
        """Initializes the validator with pre-loaded contract data."""
        if contract_data.get('contract_id') != "PPC-V2.0":
            raise ValueError("Schema mismatch: Loaded contract is not PPC-V2.0")
            
        self.contract: Dict[str, Any] = contract_data
        self.schema: List[Dict[str, Any]] = self.contract.get("validation_schema", [])

    @classmethod
    def from_file(cls, contract_path: str) -> 'ProposalSchemaValidator':
        """Load contract data from a file path and initialize the validator (decouples I/O)."""
        try:
            with open(contract_path, 'r') as f:
                contract_data = json.load(f)
            return cls(contract_data)
        except FileNotFoundError:
            raise RuntimeError(f"Contract file not found at {contract_path}")

    def _validate_type_and_pattern(self, key_path: str, data: Any, constraints: Dict[str, Any], errors: List[str]) -> None:
        """Performs type checking and regex pattern matching on a single field."""
        expected_type_str = constraints.get("type")
        
        if expected_type_str and expected_type_str in self.TYPE_MAP:
            expected_py_type = self.TYPE_MAP[expected_type_str]
            
            if not isinstance(data, expected_py_type):
                errors.append(f"Validation Failed: {key_path} type error. Expected '{expected_type_str}', got '{type(data).__name__}'.")
                return 

        # Pattern Check (only applicable if data is a string)
        if isinstance(data, str) and "pattern" in constraints:
            pattern = constraints["pattern"]
            try:
                if not re.match(pattern, data):
                    errors.append(f"Validation Failed: {key_path} pattern mismatch. Value does not conform to regex '{pattern}'.")
            except re.error:
                # Should not happen if schema is valid, but good defensive coding.
                errors.append(f"CRITICAL Schema Error: Invalid regex pattern '{pattern}' defined for {key_path}.")
                    
    def validate_payload(self, payload: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validates the given payload against the internal schema."""
        errors: List[str] = []

        for rule in self.schema:
            field_name: str = rule.get("field")
            field_level: str = rule.get("level")
            
            # 1. Top-Level Field Presence Check
            if field_name not in payload:
                if field_level == "CRITICAL":
                    errors.append(f"CRITICAL Validation Failed: Missing required top-level field: {field_name}.")
                continue

            field_data = payload[field_name]

            # 2. Detailed Definition Check (for nested keys)
            definition: Dict[str, Any] = rule.get("definition")
            
            if definition:
                if not isinstance(field_data, dict):
                    # Structure check: If sub-keys are defined, the field itself must be a dict.
                    errors.append(f"CRITICAL Structure Error: Field '{field_name}' must be a dictionary to validate sub-keys.")
                    continue
                    
                for key, constraints in definition.items():
                    key_path = f"{field_name}.{key}"
                    required = constraints.get("required", False)
                    
                    if key not in field_data:
                        if required:
                            errors.append(f"CRITICAL Validation Failed: Missing required sub-key: {key_path}.")
                        continue
                    
                    sub_data = field_data[key]
                    
                    self._validate_type_and_pattern(key_path, sub_data, constraints, errors)

        return len(errors) == 0, errors