import json
import re

class ProposalSchemaValidator:
    """Utility for rigorously validating SST payloads against the PPC contract (PPC-V2.0 schema)."""
    def __init__(self, contract_path="config/proposal_payload_contract.json"):
        try:
            with open(contract_path, 'r') as f:
                self.contract = json.load(f)
        except FileNotFoundError:
            raise RuntimeError(f"Contract file not found at {contract_path}")
            
        if self.contract.get('contract_id') != "PPC-V2.0":
            raise ValueError("Schema mismatch: Loaded contract is not PPC-V2.0")
            
        self.schema = self.contract.get("validation_schema", [])

    def validate_payload(self, payload):
        errors = []
        for rule in self.schema:
            field_name = rule["field"]
            field_level = rule["level"]
            
            if field_name not in payload:
                if field_level == "CRITICAL":
                    errors.append(f"CRITICAL Validation Failed: Missing required top-level field: {field_name}.")
                continue

            field_data = payload[field_name]

            # Detailed definition check (for nested keys)
            if "definition" in rule:
                for key, constraints in rule["definition"].items():
                    required = constraints.get("required", False)
                    
                    if required and key not in field_data:
                        errors.append(f"Field {field_name}: Missing required sub-key '{key}'.")
                        continue
                    
                    if key in field_data:
                        sub_data = field_data[key]
                        
                        # Type Check
                        expected_type = constraints.get("type")
                        if expected_type == "string" and not isinstance(sub_data, str):
                            errors.append(f"Field {field_name}.{key}: Must be a string.")
                        elif expected_type == "number" and not isinstance(sub_data, (int, float)):
                            errors.append(f"Field {field_name}.{key}: Must be a number.")

                        # Pattern Check (for strings)
                        if expected_type == "string" and "pattern" in constraints:
                            if not re.match(constraints["pattern"], sub_data):
                                errors.append(f"Field {field_name}.{key}: Data does not match pattern '{constraints['pattern']}'.")
        
        return len(errors) == 0, errors

