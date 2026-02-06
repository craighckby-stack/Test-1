class SynthesisSchemaValidator:
    def __init__(self, manifest_schema):
        self.schema = manifest_schema
        self.supported_operations = ['Multiplication', 'Addition', 'Subtraction', 'VectorAddition', 'MagnitudeNormalization']

    def validate_manifest(self, manifest_data):
        # 1. Check required top-level fields (manifestId, metrics, schemaVersion)
        if not all(k in manifest_data for k in ['manifestId', 'metrics', 'schemaVersion']):
            raise ValueError("Manifest missing critical metadata.")

        for metric_name, metric_def in manifest_data['metrics'].items():
            if 'computation' not in metric_def or 'mapping' not in metric_def:
                raise ValueError(f"Metric {metric_name} missing structured components.")

            known_variables = set(metric_def['mapping'].keys())
            known_variables.update(metric_def.get('weights', {}).keys())

            # 2. Validate computation graph and dependencies
            for step in metric_def['computation']:
                if step['operation'] not in self.supported_operations:
                    raise ValueError(f"Unsupported operation: {step['operation']}")

                # Ensure all inputs reference mapped variables or previous aliases
                for input_var in step['inputs']:
                    if input_var not in known_variables:
                        raise ValueError(f"Computation input '{input_var}' not defined in mapping/weights/previous aliases for {metric_name}.")

                # Register output alias for subsequent steps
                if 'alias' in step:
                    known_variables.add(step['alias'])
        
        return True
