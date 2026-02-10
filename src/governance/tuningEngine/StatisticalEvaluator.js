/**
 * Utility Component ID: SEV
 * Name: Statistical Evaluator
 * Function: Provides centralized, high-efficiency mathematical functions for analyzing time-series data,
 *           specifically targeting volatility and trend analysis required by the Adaptive Tuner (ATN).
 * Delegates core mathematical operations to the CoreStatisticalUtility plugin.
 */

// Assuming CoreStatisticalUtility is globally available or injected via context
declare const CoreStatisticalUtility: {
    calculateVolatility: (data: number[]) => number;
    calculateTrendSlope: (observations: Array<{ value: number, timestamp: number }>) => number;
};

/**
 * Calculates the standard deviation of a dataset (proxy for metric volatility).
 * @param {Array<number>} data - Array of recent metric observations.
 * @returns {number} The standard deviation.
 */
function calculateVolatility(data: number[]): number {
    // Delegate to centralized utility
    return CoreStatisticalUtility.calculateVolatility(data);
}

/**
 * Determines the short-term trend direction based on a linear regression slope.
 * @param {Array<{ value: number, timestamp: number }>} observations - Array of { value: number, timestamp: number } objects.
 * @returns {number} The slope of the trend (positive for increasing, negative for decreasing).
 */
function calculateTrendSlope(observations: Array<{ value: number, timestamp: number }>): number {
    // Delegate to centralized utility
    return CoreStatisticalUtility.calculateTrendSlope(observations);
}

module.exports = {
    calculateVolatility,
    calculateTrendSlope
};
