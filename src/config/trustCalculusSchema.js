/**
 * P-01 Trust Calculus Schema & Weights Definition
 * ID: TC-SCHEMA
 * Role: Defines the mathematical standards, weighting, and metric factors applied by CORE (Component Obsolescence Review Engine).
 * Ensures standardized input interpretation across governance services.
 */

export const P01_CALCULUS_WEIGHTS = {
    // Standardized input metric weightings (must sum to 1.0 for weighted sum calculations)
    weights: {
        redundancyScore: 0.40,               // Reflects fallback safety net
        criticalDependencyExposure: 0.35,    // Reflects direct risk impact
        usageRate: 0.15,                     // Reflects current component necessity
        complexityReductionEstimate: 0.10    // Reflects technical debt reduction value
    },
    
    /**
     * Defines the final trust calculation formula used by CORE.
     * All metrics must be normalized (0.0 to 1.0) prior to input.
     * @param {object} metrics - The aggregated output from RetirementMetricsService.
     * @returns {number} The final P-01 Trust Calculus Score (1.0 = High Trust, Safe to Retire).
     */
    calculateTrustScore: (metrics) => {
        const { weights } = P01_CALCULUS_WEIGHTS;
        
        // Calculate a Weighted Safety Score (Risk metrics are inverted 1 - metric)
        const safetyScore = 
            (metrics.redundancyScore * weights.redundancyScore) +
            ((1 - metrics.criticalDependencyExposure) * weights.criticalDependencyExposure) + 
            ((1 - metrics.usageRate) * weights.usageRate) + // Low usage implies higher retirement safety
            (metrics.complexityReductionEstimate * weights.complexityReductionEstimate);
        
        return Math.min(1.0, Math.max(0.0, safetyScore));
    }
};

export const METRIC_NAMES = Object.keys(P01_CALCULUS_WEIGHTS.weights);