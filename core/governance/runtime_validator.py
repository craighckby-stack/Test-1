class ConfigRuntimeValidator:
    """Ensures all governance constants adhere to defined constraints during system initialization or hot reload."""

    def validate(self, constants_dict):
        violations = []
        for domain, items in constants_dict.items():
            if domain == 'system_meta': continue
            for key, definition in items.items():
                value = definition.get('value')
                constraints = definition.get('constraints')
                symbol = definition.get('symbol', key)

                if constraints and value is not None:
                    if 'min' in constraints and value < constraints['min']:
                        violations.append(f"CRITICAL: {symbol} ({value}) below min ({constraints['min']})")
                    if 'max' in constraints and value > constraints['max']:
                        violations.append(f"CRITICAL: {symbol} ({value}) above max ({constraints['max']})")
        
        if violations:
            raise SystemGovernanceError(f"Constraint Violations Detected: {'; '.join(violations)}")
        return True
