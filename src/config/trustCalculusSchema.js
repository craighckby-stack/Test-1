/**
 * P-01 Trust Calculus Schema & Definition (TC-SCHEMA)
 * ID: TC-SCHEMA
 * Role: Defines the immutable mathematical standards, weighting, and metric factors
 *       applied by CORE (Component Obsolescence Review Engine).
 * Ensures standardized input interpretation and explicitly defines metric polarity.
 * 
 * Refactored to enforce immutability (Object.freeze) and implement strict initialization
 * validation via an internal function that throws an Error on configuration failure.
 */

// --- Constants ---

export const TRUST_POLARITY = {
    /** Higher metric value -> Higher derived Trust Score (Direct Correlation) */
    POSITIVE: 1,
    /** Higher metric value -> Lower derived Trust Score (Inverse Correlation, requires 1-X normalization) */
    NEGATIVE: -1,
};

const { POSITIVE, NEGATIVE } = TRUST_POLARITY;

// --- Schema Definition ---

const SCHEMA_DEFINITION = {
    redundancyScore: {
        weight: 0.40,
        polarity: POSITIVE,
        description: "Reflects fallback safety net availability (resilience metric)."
    },
    criticalDependencyExposure: {
        weight: 0.35,
        polarity: NEGATIVE,
        description: "Reflects direct risk impact from potential failure cascade."
    },
    usageRate: {
        weight: 0.15,
        polarity: NEGATIVE,
        description: "Reflects current component necessity (Inverted: Lower usage increases retirement safety margin)."
    },
    complexityReductionEstimate: {
        weight: 0.10,
        polarity: POSITIVE,
        description: "Reflects technical debt reduction value upon retirement/removal."
    }
};

// --- Validation and Export ---

/**
 * Validates the schema integrity, primarily ensuring weights sum correctly,
 * and extracts the metric names. Throws an error on configuration failure.
 * @param {Object} schema 
 * @returns {string[]} Metric names
 */
function validateSchemaAndGetNames(schema) {
    const totalWeight = Object.values(schema).reduce((sum, item) => sum + item.weight, 0);
    const WEIGHT_TOLERANCE = 1e-9; // Sufficient precision for floating point sum check

    if (Math.abs(totalWeight - 1.0) > WEIGHT_TOLERANCE) {
        throw new Error(
            `[TC-SCHEMA ERROR] Initialization Failure: Metric weights must sum exactly to 1.0. Current sum: ${totalWeight}`
        );
    }
    
    // Check if all defined polarities are valid constants
    for (const key in schema) {
        const p = schema[key].polarity;
        if (p !== POSITIVE && p !== NEGATIVE) {
             throw new Error(`[TC-SCHEMA ERROR] Invalid polarity value for metric '${key}': ${p}`);
        }
    }

    return Object.keys(schema);
}

// Execute validation immediately upon module load
export const METRIC_NAMES = validateSchemaAndGetNames(SCHEMA_DEFINITION);

// Export the validated and frozen schema to enforce immutability.
export const TRUST_METRICS_SCHEMA = Object.freeze(SCHEMA_DEFINITION);