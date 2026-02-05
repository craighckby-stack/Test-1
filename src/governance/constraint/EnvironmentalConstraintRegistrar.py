# ECR: Environmental Constraint Registrar (V1.0)
# Role: Stage 4 Constraint Check (Pre-MCR Commit)

class EnvironmentalConstraintRegistrar:
    def __init__(self, resource_config, cost_ceiling):
        self.resource_config = resource_config
        self.cost_ceiling = cost_ceiling

    def pre_commit_validation(self, M02_projection):
        """Validates M-02 projected resource utilization against active governance ceilings.
        Input: M-02 post-PSR trace data (M02_projection)
        Output: Constraint Metric Input (to S-02/MCRA Engine) and PASS/FAIL boolean.
        """
        projected_cpu = M02_projection.get('cpu_load_max', 0)
        projected_cost = M02_projection.get('projected_cost_t5', 0)
        
        # Check against operational governance constraints
        if projected_cpu > self.resource_config['max_cpu_percent']:
            return False, f"CPU constraint violation: {projected_cpu}"
        
        if projected_cost > self.cost_ceiling:
            return False, f"Cost ceiling breach: {projected_cost}"

        return True, {
            "environmental_load_factor": projected_cpu * 0.5 + projected_cost * 0.5
        }

# ECR output is a vital input for S-02 calculation by the MCRA Engine.