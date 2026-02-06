import math
from typing import Dict, Any, Callable, Union

# Define internal scaling constants for clarity and type safety
SCALE_TYPE_ADAPTIVE_INVERSE = "ADAPTIVE_INVERSE_MAPPING"
SCALE_TYPE_EXPONENTIAL_DECAY = "EXPONENTIAL_DECAY_0_TO_1"

class ConstraintEvaluationError(Exception):
    """Base exception for constraint evaluation failures."""
    pass

class ConstraintEvaluatorRuntime:
    """ 
    Core engine for interpreting Structured Constraint Definitions (SCD) 
    and real-time metrics (RTM) to determine final runtime governance values.
    Implements a Strategy pattern for various scaling algorithms.
    """

    # --- Internal Scaling Functions (Static Strategies) ---

    @staticmethod
    def _scale_exponential_decay(metric_value: float, params: Dict[str, float]) -> float:
        """Scales weight using exponential decay: factor = e^(-k * metric_value), clamped to [0, 1]."""
        k = params.get('decay_rate', 1.0)
        # math.exp calculation provides the normalized scaling factor
        return max(0.0, min(1.0, math.exp(-k * metric_value)))

    @staticmethod
    def _scale_inverse_linear(metric_value: float, params: Dict[str, float]) -> float:
        """Calculates a normalized reduction factor using inverse linear mapping, clamped."""
        factor = params.get('factor_coefficient', 1.0)
        offset = params.get('offset', 0.0)
        
        reduction = (metric_value - offset) * factor
        
        max_reduction = params.get('max_reduction_limit', float('inf'))
        reduction = min(reduction, max_reduction)
        
        # Normalized reduction (1.0 is full weight, 0.0 is zero weight)
        return max(0.0, 1.0 - reduction)

    SCALING_STRATEGIES: Dict[str, Callable[[float, Dict[str, float]], float]] = {
        SCALE_TYPE_EXPONENTIAL_DECAY: _scale_exponential_decay,
        SCALE_TYPE_ADAPTIVE_INVERSE: _scale_inverse_linear, 
    }

    # --- Public Calculation Methods ---

    def calculate_omega(self, rtm_exposure: float, params: Dict[str, Union[float, str]]) -> float:
        """
        Calculates the final Omega factor (scaling parameter) using an adaptive inverse mapping.
        Assumes parameters have been validated (e.g., via Constraint Schemas).
        """
        try:
            base_value = float(params['base_value'])
            metric_factor_coefficient = float(params['metric_factor_coefficient'])
            max_reduction_limit = float(params['max_reduction_limit'])
            min_omega_floor = float(params['min_omega_floor'])
        except KeyError as e:
            raise ConstraintEvaluationError(f"Missing required parameter for Omega calculation: {e}")
        except ValueError as e:
             raise ConstraintEvaluationError(f"Invalid type encountered in parameters: {e}")

        reduction = rtm_exposure * metric_factor_coefficient
        reduction = min(reduction, max_reduction_limit)
        omega = base_value - reduction
        return max(omega, min_omega_floor)

    def calculate_dynamic_weight(self, metric_value: float, definition: Dict[str, Any]) -> float:
        """
        Calculates a dynamic constraint weight based on a defined scaling type and parameters 
        (Structured Constraint Definition - SCD).
        """
        
        try:
            scaling_type = definition['scaling_type']
            baseline_weight = float(definition['baseline_weight'])
            dynamic_scaling_parameters = definition['dynamic_scaling_parameters']
        except KeyError as e:
            raise ConstraintEvaluationError(f"Missing required definition key for dynamic weight calculation: {e}")

        
        strategy = self.SCALING_STRATEGIES.get(scaling_type)
        if not strategy:
            raise ConstraintEvaluationError(f"Unknown scaling type defined: '{scaling_type}'. Available: {list(self.SCALING_STRATEGIES.keys())}")

        # The strategy function returns the normalized scaling factor (0.0 to 1.0)
        normalized_factor = strategy(metric_value, dynamic_scaling_parameters)

        # Apply the scaling factor to the baseline weight
        final_weight = baseline_weight * normalized_factor
        
        return final_weight