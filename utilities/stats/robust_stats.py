import numpy as np
from typing import Tuple, Optional

# Standard scaling factor for consistency with Gaussian standard deviation 
# Defined as 1 / (Phi^-1(0.75))
_DEFAULT_MAD_SCALE = 1.4826

# --- Internal Utility Functions ---

def _validate_inputs(
    values: np.ndarray, 
    weights: np.ndarray
) -> Tuple[np.ndarray, np.ndarray, float]:
    """Helper to validate inputs and calculate normalized weights."""
    
    values = np.ravel(values).astype(float)
    weights = np.ravel(weights).astype(float)
    
    if values.size == 0:
        raise ValueError("Input data cannot be empty.")
    if values.shape != weights.shape:
        raise ValueError("Values and weights must have the same shape.")
    
    # Ensure weights are non-negative
    if np.any(weights < 0):
        raise ValueError("Weights must be non-negative.")
        
    total_weight = np.sum(weights)
    # Check against machine epsilon for near-zero total weight
    if total_weight <= np.finfo(float).eps:
        raise ValueError("Total weight is effectively zero.")

    # Normalize weights
    normalized_weights = weights / total_weight
    
    return values, normalized_weights, total_weight


# --- Public Robust Statistical Measures ---

def calculate_weighted_median(values: np.ndarray, weights: np.ndarray) -> float:
    """
    Calculates the weighted median of a 1D NumPy array.

    The weighted median is the value X such that the sum of weights 
    for all data points less than X is <= 0.5, and the sum of weights 
    for all data points greater than X is <= 0.5.

    Args:
        values (np.ndarray): The data points (1D).
        weights (np.ndarray): The corresponding weights (non-negative, 1D).

    Returns:
        float: The weighted median.
    
    Raises:
        ValueError: If inputs are invalid (empty, mismatch, zero total weight).
    """
    values, normalized_weights, _ = _validate_inputs(values, weights)

    # 1. Sort based on values
    sorted_indices = np.argsort(values)
    sorted_values = values[sorted_indices]
    sorted_weights = normalized_weights[sorted_indices]
    
    # 2. Calculate cumulative weights
    cumulative_weights = np.cumsum(sorted_weights)
    
    # 3. Find the index where cumulative weight crosses 0.5
    # 'left' means the lowest index i such that a[i] >= 0.5
    median_index = np.searchsorted(cumulative_weights, 0.5, side='left')
    
    return sorted_values[median_index]


def calculate_wmad(
    values: np.ndarray, 
    weights: np.ndarray, 
    scaling_factor: float = _DEFAULT_MAD_SCALE
) -> Tuple[float, float]:
    """
    Calculates the Weighted Median (W_Median) and the Weighted Median Absolute Deviation (WMAD).
    
    The WMAD provides a robust measure of spread:
    WMAD = scaling_factor * W_Median(|values - W_Median(values)|).

    Args:
        values (np.ndarray): The data points.
        weights (np.ndarray): The corresponding weights (non-negative).
        scaling_factor (float, optional): Factor (1.4826 for Gaussian consistency).

    Returns:
        Tuple[float, float]: (weighted_median, wmad)
    """
    
    # 1. Calculate the center (Weighted Median)
    # Input validation is handled inside calculate_weighted_median
    weighted_median = calculate_weighted_median(values, weights)
    
    # 2. Calculate the weighted median of the absolute deviations
    deviations = np.abs(values - weighted_median)
    
    # The weights remain the same for the deviation calculation
    wmad_raw = calculate_weighted_median(deviations, weights)

    robust_spread = scaling_factor * wmad_raw
    
    return weighted_median, robust_spread
    

def calculate_median_mad(
    values: np.ndarray,
    scaling_factor: float = _DEFAULT_MAD_SCALE
) -> Tuple[float, float]:
    """
    Calculates the standard Median and Median Absolute Deviation (MAD) 
    by treating the inputs as uniformly weighted.

    Args:
        values (np.ndarray): The data points.
        scaling_factor (float, optional): Factor (1.4826 for Gaussian consistency).

    Returns:
        Tuple[float, float]: (median, mad)
    """
    values = np.ravel(values)
    if values.size == 0:
        raise ValueError("Input data cannot be empty.")

    # Create uniform weights
    uniform_weights = np.ones_like(values, dtype=float)
    
    return calculate_wmad(values, uniform_weights, scaling_factor)