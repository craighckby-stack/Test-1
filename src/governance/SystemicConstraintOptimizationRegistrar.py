# SCOR (Systemic Constraint Optimization Registrar) Module
# AGI Mandate v94.1: Autonomous Code Evolution & Scaffolding
# GSEP Scope: Stage 3/4 Boundary (S-04 Calculation - Constraint Vector Mapping)
# Mandate: Model long-term systemic entropy and architectural cost (Technical Debt) of Mutation Payload (M-02).

from systems.models.M02_Payload import MutationPayload
from policy.RuleSource import GovernanceRuleSource
from metrics.AttestationRegistrar import TIAR
from governance.ConstraintKeys import ConstraintKey
from typing import Dict, Any, List, Tuple, Callable

# Define a strict list of constraint calculation methods for dynamic processing
CONSTRAINTS: List[Tuple[ConstraintKey, str]] = [
    (ConstraintKey.COUPLING_PENALTY, '_calculate_coupling_penalty'),
    (ConstraintKey.RESOURCE_DEBT, '_calculate_resource_debt'),
    (ConstraintKey.POLICY_DEVIATION, '_calculate_policy_deviation'),
]

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
        
        risk_weight = self.grs.get_weight('COUPLING_RISK')
        penalty = payload.analyze_coupling_change() * risk_weight
        # Use standardized key defined in the ConstraintKey Enum
        self._constraint_vector[ConstraintKey.COUPLING_PENALTY.value] = penalty
        return penalty

    def _calculate_resource_debt(self, payload: MutationPayload) -> float:
        """Constraint 2: Projects the long-term resource elasticity debt projection."""
        
        resource_cost = payload.project_long_term_resource_cost()
        self._constraint_vector[ConstraintKey.RESOURCE_DEBT.value] = resource_cost
        return resource_cost

    def _calculate_policy_deviation(self, payload: MutationPayload) -> float:
        """Constraint 3: Assesses penalty for complexity near mandated policy ceilings."""
        
        deviation_penalty = self.grs.check_complexity_ceiling(payload)
        self._constraint_vector[ConstraintKey.POLICY_DEVIATION.value] = deviation_penalty
        return deviation_penalty

    def calculate_S04_metric(self, payload: MutationPayload) -> Dict[str, Any]:
        """
        Primary interface: Calculates the aggregated S-04 score by combining all 
        systemic constraint penalties using a dynamic constraint loop.

        Returns: Dictionary containing the total S04_score and the detailed constraint_vector.
        """
        
        if not isinstance(payload, MutationPayload):
            raise TypeError("S-04 calculation requires a valid MutationPayload object.")
            
        self._constraint_vector = {} 
        S04_score_total = 0.0
        
        # Dynamic Constraint Execution Loop
        for key_enum, method_name in CONSTRAINTS:
            method: Callable[[MutationPayload], float] = getattr(self, method_name, None)
            
            if method is None:
                # Critical logging mechanism would trigger here in a production system
                raise AttributeError(f"Missing required constraint calculation method: {method_name}")

            try:
                penalty = method(payload)
                S04_score_total += penalty
            except Exception as e:
                # Robust error handling for individual constraint failure
                print(f"Error calculating constraint {key_enum.value}: {e}")
                # Default to 0.0 penalty if calculation fails unexpectedly
                self._constraint_vector[key_enum.value] = 0.0
        
        # Register detailed results for C-11 ingestion and historical attestation
        TIAR.register_metric(
            metric_key=ConstraintKey.S04_TOTAL.value, 
            value=S04_score_total, 
            details=self._constraint_vector
        )
        
        return {
            "S04_score_total": S04_score_total,
            "constraint_vector": self._constraint_vector
        }