# SCOR (Systemic Constraint Optimization Registrar) Module
# AGI Mandate v94.1: Autonomous Code Evolution & Scaffolding
# GSEP Scope: Stage 3/4 Boundary (S-04 Calculation - Constraint Vector Mapping)
# Mandate: Model long-term systemic entropy and architectural cost (Technical Debt) of Mutation Payload (M-02).

from systems.models.M02_Payload import MutationPayload
from policy.RuleSource import GovernanceRuleSource
from metrics.AttestationRegistrar import TIAR
from governance.ConstraintKeys import ConstraintKey
# Import the newly proposed audit stream for critical failure logging
from governance.GovernanceAuditStream import GovernanceAuditStream
from typing import Dict, Any, List, Tuple, Callable


class SCOR:
    """
    The Systemic Constraint Optimization Registrar calculates S-04, the quantitative metric 
    quantifying projected architectural degradation (Technical Debt) and resource debt 
    incurred by the Mutation Payload (M-02). Calculation methods are decoupled from state updates.
    """

    # Map ConstraintKey to the internal method name for dynamic lookup
    _CONSTRAINT_MAPPING: Dict[ConstraintKey, str] = {
        ConstraintKey.COUPLING_PENALTY: '_calculate_coupling_penalty',
        ConstraintKey.RESOURCE_DEBT: '_calculate_resource_debt',
        ConstraintKey.POLICY_DEVIATION: '_calculate_policy_deviation',
    }

    def __init__(self, grs: GovernanceRuleSource):
        if not isinstance(grs, GovernanceRuleSource):
            raise TypeError("SCOR initialization requires a valid GovernanceRuleSource instance.")
        self.grs = grs
        # Internal state to hold calculated constraint components for detailed attestation
        self._constraint_vector: Dict[str, float] = {}

    def _calculate_coupling_penalty(self, payload: MutationPayload) -> float:
        """Constraint 1: Calculates penalty based on cross-module coupling coefficient.
        Returns the calculated penalty only, without updating internal state.
        """
        risk_weight = self.grs.get_weight('COUPLING_RISK')
        return payload.analyze_coupling_change() * risk_weight

    def _calculate_resource_debt(self, payload: MutationPayload) -> float:
        """Constraint 2: Projects the long-term resource elasticity debt projection.
        Returns the calculated cost only, without updating internal state.
        """
        return payload.project_long_term_resource_cost()

    def _calculate_policy_deviation(self, payload: MutationPayload) -> float:
        """Constraint 3: Assesses penalty for complexity near mandated policy ceilings.
        Returns the calculated deviation penalty only, without updating internal state.
        """
        return self.grs.check_complexity_ceiling(payload)

    def _execute_constraint(self, key: ConstraintKey, payload: MutationPayload) -> float:
        """
        Executes a single constraint calculation, handles method lookup, error logging, 
        and updates the constraint vector upon successful completion.
        """
        method_name = self._CONSTRAINT_MAPPING.get(key)
        if not method_name:
            raise ValueError(f"ConstraintKey {key.value} is defined but missing mapping in SCOR.")
            
        method: Callable[[MutationPayload], float] = getattr(self, method_name, None)
        
        if method is None:
            raise AttributeError(f"Missing constraint calculation implementation: {method_name}")

        try:
            penalty = method(payload)
            # Update state immediately upon successful calculation
            self._constraint_vector[key.value] = penalty
            return penalty
        except Exception as e:
            # Use dedicated audit stream for critical calculation failures
            GovernanceAuditStream.log_critical_failure(
                component='SCOR', 
                context=f"Constraint {key.value} calculation failed", 
                error=str(e)
            )
            # Default to 0.0 penalty if calculation fails unexpectedly, ensuring system stability
            self._constraint_vector[key.value] = 0.0
            return 0.0

    def calculate_S04_metric(self, payload: MutationPayload) -> Dict[str, Any]:
        """
        Primary interface: Calculates the aggregated S-04 score by iterating through 
        all defined systemic constraint penalties.

        Returns: Dictionary containing the total S04_score and the detailed constraint_vector.
        """
        
        if not isinstance(payload, MutationPayload):
            raise TypeError("S-04 calculation requires a valid MutationPayload object.")
            
        self._constraint_vector = {} 
        S04_score_total = 0.0
        
        # Dynamic Constraint Execution Loop using the centralized mapping
        for key in self._CONSTRAINT_MAPPING.keys():
            S04_score_total += self._execute_constraint(key, payload)
        
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