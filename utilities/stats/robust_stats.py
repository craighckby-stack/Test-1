import numpy as np
from typing import Tuple

def calculate_weighted_median(values: np.ndarray, weights: np.ndarray) -> float:
    """Calculates the weighted median of a 1D NumPy array."""
    if values.size == 0:
        raise ValueError("Cannot calculate median on empty data.")
        
    normalized_weights = weights / np.sum(weights)

    # Sort based on values
    sorted_indices = np.argsort(values)
    sorted_values = values[sorted_indices]
    sorted_weights = normalized_weights[sorted_indices]
    cumulative_weights = np.cumsum(sorted_weights)
    
    # Find the index where cumulative weight crosses 0.5
    median_index = np.where(cumulative_weights >= 0.5)[0][0]
    
    return sorted_values[median_index]

def calculate_wmad(values: np.ndarray, weights: np.ndarray, scaling_factor: float = 1.4826) -> Tuple[float, float]:
    """
    Calculates the Weighted Median and the Weighted Median Absolute Deviation (WMAD).
    Returns (weighted_median, wmad).
    """
    accepted_value = calculate_weighted_median(values, weights)
    
    # Calculate the weighted median of the deviations
    deviations = np.abs(values - accepted_value)
    weighted_mad = calculate_weighted_median(deviations, weights)

    robust_spread = scaling_factor * weighted_mad
    
    return accepted_value, robust_spread
