/**
 * CORE Metric Weight Configuration
 * Defines the standardized weights and parameters for normalizing raw metrics
 * provided by the Retirement Metrics Service (RMS) before inputting into 
 * the P-01 Trust Calculus Adjudication engine (CORE).
 *
 * Higher weights indicate higher influence on the final retirement decision.
 */

export const METRIC_WEIGHTS = {
    
    // --- ADJUDICATION CATEGORY WEIGHTS (0-3.0 range recommended) ---
    
    // Safety Factors (Positive influence towards Trust/Retention if high)
    REDUNDANCY: 1.5, // High redundancy offers high retirement confidence.

    // Risk Factors (Negative influence towards Trust/Retention if high)
    DEPENDENCY_EXPOSURE: 2.0, // Critical downstream risk requires heavier weighting.
    
    // Overhead Factors (Positive influence towards Retirement if high)
    COMPLEXITY_REDUCTION: 1.2, // Benefits derived from reducing maintenance burden.
    MAINTENANCE_BURDEN_INDEX: 1.0,
    
    // Usage Penalty/Incentive Factor (Special adjustment)
    USAGE_RATE_PENALTY: 1.8 // High penalty for low usage components, strongly pushing for retirement.
};