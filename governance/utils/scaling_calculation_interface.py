from abc import ABC, abstractmethod
from ..definitions.constraint_schemas import DynamicScalingDefinition


class AbstractScalingEngine(ABC):
    """Abstract interface for components responsible for calculating dynamic constraint weights and factors based on governance schemas."""

    @abstractmethod
    def calculate_scaling_factor(
        self, 
        definition: DynamicScalingDefinition, 
        metric_input_value: float
    ) -> float:
        """Calculates the factor (0.0 to 1.0) by which the baseline_weight is multiplied."""
        pass

    @abstractmethod
    def calculate_omega(
        self, 
        omega_params: dict, 
        rtm_exposure: float
    ) -> float:
        """Calculates the resultant Omega value based on core parameters and RTM exposure metric (using definition provided in schema)."""
        pass

    @abstractmethod
    def get_supported_types(self) -> set:
        """Returns the set of supported ScalingType literals handled by this engine instance."""
        pass