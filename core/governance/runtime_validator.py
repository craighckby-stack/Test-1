class ConfigRuntimeValidator:
    """
    Ensures all governance constants adhere to defined constraints during system 
    initialization or hot reload. Utilizes a structured handler approach for 
    extensible and robust constraint checking.
    """

    def __init__(self):
        # Define constraint handlers for specific constraint types (Extensibility Hook)
        self._constraint_handlers = {
            'min': self._validate_min,
            'max': self._validate_max,
            'type': self._validate_type,
            'required': self._validate_required
        }
        self._type_map = {'int': int, 'float': float, 'str': str, 'bool': bool, 'list': list, 'dict': dict}

    def _format_location(self, domain: str, key: str, symbol: str) -> str:
        """Formats the location identifier for clear error reporting."""
        return f"{domain}.{key} ({symbol})"

    # --- Constraint Handlers ---

    def _validate_required(self, value, constraint, location: str):
        if constraint is True and value is None:
            return f"CRITICAL: {location} is required but its value is None."
        return None

    def _validate_min(self, value, constraint: (int, float), location: str):
        if isinstance(value, (int, float)) and value < constraint:
            return f"CRITICAL: {location} ({value}) below required minimum ({constraint})."
        return None

    def _validate_max(self, value, constraint: (int, float), location: str):
        if isinstance(value, (int, float)) and value > constraint:
            return f"CRITICAL: {location} ({value}) above required maximum ({constraint})."
        return None
    
    def _validate_type(self, value, constraint: str, location: str):
        expected_type = self._type_map.get(constraint)
        
        if expected_type and value is not None and not isinstance(value, expected_type):
            return f"CRITICAL: {location} ({value}) expected type '{constraint}' but got '{type(value).__name__}'."
        return None

    # --- Main Validation Logic ---

    def validate(self, constants_dict: dict) -> bool:
        violations = []

        for domain, items in constants_dict.items():
            if domain == 'system_meta':
                continue

            for key, definition in items.items():
                value = definition.get('value')
                constraints = definition.get('constraints', {})
                symbol = definition.get('symbol', key)
                
                location = self._format_location(domain, key, symbol)

                # Handle constraints
                for constraint_key, constraint_value in constraints.items():
                    handler = self._constraint_handlers.get(constraint_key)
                    
                    # Check required fields first, regardless of whether value is None
                    if constraint_key == 'required':
                        error = self._validate_required(value, constraint_value, location)
                        if error:
                            violations.append(error)
                            # If required fails, no need to check other constraints for this item
                            continue 
                    
                    # Run other validators only if value exists
                    elif handler and value is not None:
                        error = handler(value, constraint_value, location)
                        if error:
                            violations.append(error)
                    
                    # Handle unknown/unsupported constraint types if necessary (omitted for brevity)

        if violations:
            # SystemGovernanceError must be imported or defined.
            raise SystemGovernanceError(f"System Governance Constraint Violations Detected:\n - " + "\n - ".join(violations))
            
        return True