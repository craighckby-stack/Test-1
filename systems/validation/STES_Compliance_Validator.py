import json

class STESComplianceValidator:
    def __init__(self, spec_path='governance/protocols/STES_specification.json'):
        with open(spec_path, 'r') as f:
            self.spec = json.load(f)
        self.constraints = self.spec['efficiency_directives']['validation_constraints']

    def validate_proposal(self, proposal_data):
        results = []
        is_compliant = True

        # Example Constraint VC-003 Check: Predicted Gain
        min_gain = self.spec['efficiency_directives']['validation_constraints'][2]['rule']
        if proposal_data.get('predicted_gain_percentage', 0) < -0.10: # Degradation Check
            results.append({'id': 'VC-003_DEGRADATION', 'status': 'FAILURE', 'reason': 'Proposal results in excessive performance degradation (>10%) and is not justified as a security patch.'})
            is_compliant = False
        
        # Add checks for required lifecycle fields
        required_fields = self.spec['lifecycle_stages']['schema']['required']
        for field in required_fields:
            if field not in proposal_data:
                results.append({'id': 'SCHEMA_MISSING', 'status': 'FAILURE', 'reason': f'Missing required schema field: {field}'})
                is_compliant = False

        return is_compliant, results

# Note: This utility must be integrated into the PRE_INTEGRATION hook defined in STES_specification.json
