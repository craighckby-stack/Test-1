import json
import re
from typing import Dict, Any, List, Tuple, Union

class GSEPContractValidator:
    """Utility for rigorously validating GSEP payloads against defined contracts (e.g., PPC-V2.0 schema)."""
    
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
        contract_id = contract_data.get('contract_id')
        if contract_id != "PPC-V2.0":
            raise ValueError(f"Schema mismatch: Loaded contract ID '{contract_id}' is not PPC-V2.0")
            
        self.contract: Dict[str, Any] = contract_data
        # Expect schema to be a list of rules
        self.schema: List[Dict[str, Any]] = self.contract.get("validation_schema", [])

    @classmethod
    def from_file(cls, contract_path: str) -> 'GSEPContractValidator':
        """Load contract data from a file path and initialize the validator (decouples I/O)."""
        try:
            with open(contract_path, 'r') as f:
                contract_data = json.load(f)
            return cls(contract_data)
        except FileNotFoundError:
            raise RuntimeError(f"Contract file not found at {contract_path}")
        except json.JSONDecodeError:
            raise RuntimeError(f"Failed to decode JSON from contract file at {contract_path}")

    def _apply_constraints(self, data: Any, constraints: Dict[str, Any], key_path: str, errors: List[str]) -> None:
        """Encapsulates and applies type checking and regex pattern matching on a single field/sub-key."""
        expected_type_str = constraints.get("type")
        
        # 1. Type Check
        if expected_type_str and expected_type_str in self.TYPE_MAP:
            expected_py_type = self.TYPE_MAP[expected_type_str]
            
            if not isinstance(data, expected_py_type):
                # Use string name defined in schema for display
                display_type = expected_type_str 
                errors.append(f"Validation Failed: {key_path} type mismatch. Expected '{display_type}', got '{type(data).__name__}'.")
                return 

        # 2. Pattern Check (only applicable if data is a string)
        if isinstance(data, str) and "pattern" in constraints:
            pattern = constraints["pattern"]
            try:
                if not re.match(pattern, data):
                    errors.append(f"Validation Failed: {key_path} pattern mismatch. Value does not conform to regex '{pattern}'.")
            except re.error:
                errors.append(f"CRITICAL Schema Error: Invalid regex pattern '{pattern}' defined for {key_path}.")
                    
    def validate_payload(self, payload: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validates the given payload against the internal schema rules."""
        errors: List[str] = []

        for rule in self.schema:
            field_name: str = rule.get("field")
            level: str = rule.get("level", "NORMAL")
            definition: Dict[str, Any] = rule.get("definition")
            
            # 1. Top-Level Field Presence Check
            if field_name not in payload:
                if level == "CRITICAL":
                    errors.append(f"CRITICAL Validation Failed: Missing required top-level field: {field_name}.")
                continue

            field_data = payload[field_name]

            # 2. Structural/Type Validation
            
            # Case A: Primitive/Array/Object type defined directly on the field (no nested definition)
            if not definition:
                self._apply_constraints(field_data, rule, field_name, errors)
                continue

            # Case B: Nested Validation (requires field_data to be an object/dictionary)
            
            if not isinstance(field_data, dict):
                errors.append(f"CRITICAL Structure Error: Field '{field_name}' must be a dictionary (object) to validate its internal sub-keys defined in the schema.")
                continue
                
            for key, constraints in definition.items():
                key_path = f"{field_name}.{key}"
                required = constraints.get("required", False)
                
                if key not in field_data:
                    if required:
                        errors.append(f"CRITICAL Validation Failed: Missing required sub-key: {key_path}.")
                    continue
                
                sub_data = field_data[key]
                
                # Apply constraints to the sub-key data
                self._apply_constraints(sub_data, constraints, key_path, errors)

        return len(errors) == 0, errors
