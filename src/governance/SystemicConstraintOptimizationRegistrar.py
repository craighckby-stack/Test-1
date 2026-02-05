# SCOR (Systemic Constraint Optimization Registrar) Module
# AGI Mandate v94.1: Autonomous Code Evolution & Scaffolding
# GSEP Scope: Stage 3/4 Boundary (S-04 Calculation - Constraint Vector Mapping)
# Mandate: Model long-term systemic entropy and architectural cost (Technical Debt) of Mutation Payload (M-02).

from systems.models.M02_Payload import MutationPayload
from policy.RuleSource import GovernanceRuleSource
from metrics.AttestationRegistrar import TIAR
from typing import Dict, Any

class SCOR:
    """
    The Systemic Constraint Optimization Registrar calculates S-04, the quantitative metric 
    quantifying projected architectural degradation (Technical Debt) and resource debt 
    incurred by the Mutation Payload (M-02).
    """

    def __init__(self, grs: GovernanceRuleSource):
        if not isinstance(grs, GovernanceRuleSource):
            raise TypeError("SCOR initialization requires a valid GovernanceRuleSource instance.")
        self.grs = grs
        # Internal state to hold calculated constraint components for detailed attestation
        self._constraint_vector: Dict[str, float] = {}

    def _calculate_coupling_penalty(self, payload: MutationPayload) -> float:
        """Constraint 1: Calculates penalty based on cross-module coupling coefficient."""
        
        # Retrieve system risk weight defined by GRS policy engine
        risk_weight = self.grs.get_weight('COUPLING_RISK')
        
        # Calculates magnitude of coupling change * Policy defined risk weight
        penalty = payload.analyze_coupling_change() * risk_weight
        self._constraint_vector['COUPLING_PENALTY'] = penalty
        return penalty

    def _calculate_resource_debt(self, payload: MutationPayload) -> float:
        """Constraint 2: Projects the long-term resource elasticity debt projection."""
        
        # Payload method assumed to return a normalized cost index projection
        resource_cost = payload.project_long_term_resource_cost()
        self._constraint_vector['RESOURCE_DEBT'] = resource_cost
        return resource_cost

    def _calculate_policy_deviation(self, payload: MutationPayload) -> float:
        """Constraint 3: Assesses penalty for complexity near mandated policy ceilings."""
        
        # Policy deviation returns 0.0 or a quantifiable penalty index
        deviation_penalty = self.grs.check_complexity_ceiling(payload)
        self._constraint_vector['POLICY_DEVIATION'] = deviation_penalty
        return deviation_penalty

    def calculate_S04_metric(self, payload: MutationPayload) -> Dict[str, Any]:
        """
        Primary interface: Calculates the aggregated S-04 score by combining all 
        systemic constraint penalties.

        Returns: Dictionary containing the total S04_score and the detailed constraint_vector.
        """
        
        if not isinstance(payload, MutationPayload):
            raise TypeError("S-04 calculation requires a valid MutationPayload object.")
            
        # Reset constraint vector state for the new calculation
        self._constraint_vector = {} 
        
        coupling_penalty = self._calculate_coupling_penalty(payload)
        resource_debt = self._calculate_resource_debt(payload)
        policy_deviation_penalty = self._calculate_policy_deviation(payload)

        # S-04 Aggregate Summation
        S04_score_total = coupling_penalty + resource_debt + policy_deviation_penalty
        
        # Register detailed results for C-11 ingestion and historical attestation
        TIAR.register_metric(
            metric_key='S-04', 
            value=S04_score_total, 
            details=self._constraint_vector
        )
        
        return {
            "S04_score_total": S04_score_total,
            "constraint_vector": self._constraint_vector
        }