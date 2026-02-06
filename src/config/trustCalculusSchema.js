/**
 * P-01 Trust Calculus Schema & Definition (TC-SCHEMA)
 * ID: TC-SCHEMA
 * Role: Defines the immutable mathematical standards, weighting, and metric factors 
 *       applied by CORE (Component Obsolescence Review Engine).
 * Ensures standardized input interpretation and explicitly defines metric polarity.
 */

// Polarity: 1 = Direct Correlation (Higher metric -> Higher trust)
//          -1 = Inverse Correlation (Higher metric -> Lower trust, requires 1 - metric adjustment during calculation)
export const TRUST_METRICS_SCHEMA = {
    redundancyScore: {
        weight: 0.40,
        polarity: 1,
        description: "Reflects fallback safety net availability."
    },
    criticalDependencyExposure: {
        weight: 0.35,
        polarity: -1,
        description: "Reflects direct risk impact from potential failure."
    },
    usageRate: {
        weight: 0.15,
        polarity: -1,
        description: "Reflects current component necessity (Inverted: Lower usage increases retirement safety)."
    },
    complexityReductionEstimate: {
        weight: 0.10,
        polarity: 1,
        description: "Reflects technical debt reduction value upon retirement."
    }
};

// Utility array of metric names for schema consumers (e.g., validators/calculators).
export const METRIC_NAMES = Object.keys(TRUST_METRICS_SCHEMA);

// Sanity check: Ensure weights sum close to 1.0
const totalWeight = Object.values(TRUST_METRICS_SCHEMA).reduce((sum, item) => sum + item.weight, 0);
if (Math.abs(totalWeight - 1.0) > 1e-6) {
    console.error(`[TC-SCHEMA ERROR] Metric weights must sum exactly to 1.0. Current sum: ${totalWeight}`);
}