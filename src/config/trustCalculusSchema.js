/**
 * P-01 Trust Calculus Schema & Definition (TC-SCHEMA)
 * ID: TC-SCHEMA
 * Role: Defines the immutable mathematical standards, weighting, and metric factors
 *       applied by CORE (Component Obsolescence Review Engine).
 * Ensures standardized input interpretation and explicitly defines metric polarity.
 * 
 * Refactored for explicit type definitions (JSDoc) and enforcement of strict configuration.
 */

/** @typedef {1 | -1} TrustPolarityValue - 1: Positive Correlation, -1: Negative Correlation */
/**
 * @typedef {Object} TrustMetricSchemaItem
 * @property {number} weight - Weight factor (0.0 to 1.0). Total weights must sum to 1.0.
 * @property {TrustPolarityValue} polarity - Defines correlation with Trust Score.
 * @property {string} description - Semantic explanation of the metric.
 */

// NOTE: Assuming the existence of a kernel-provided WeightedSchemaValidator tool for weight summation.

// --- Constants ---

export const TRUST_POLARITY = /** @type {{POSITIVE: TrustPolarityValue, NEGATIVE: TrustPolarityValue}} */ ({
    /** Higher metric value -> Higher derived Trust Score (Direct Correlation) */
    POSITIVE: 1,
    /** Higher metric value -> Lower derived Trust Score (Inverse Correlation, requires 1-X normalization) */
    NEGATIVE: -1,
});

const { POSITIVE, NEGATIVE } = TRUST_POLARITY;

// --- Schema Definition ---

/** @type {{[metricName: string]: TrustMetricSchemaItem}} */
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

// Define a conceptual tool interface for execution environment compatibility
const WeightedSchemaValidator = globalThis.WeightedSchemaValidator || {
    execute: (args) => {
        const { schema, weightKey, targetSum = 1.0, tolerance = 1e-9 } = args;
        let currentSum = 0;
        const items = Object.values(schema);

        for (const item of items) {
            if (item && typeof item === 'object' && typeof item[weightKey] === 'number') {
                currentSum += item[weightKey];
            } else {
                return { isValid: false, error: `Item missing or invalid weight property '${weightKey}'.` };
            }
        }

        const difference = Math.abs(currentSum - targetSum);
        const isValid = difference < tolerance;

        if (!isValid) {
            return {
                isValid: false,
                error: `Metric weights must sum exactly to ${targetSum}. Current sum: ${currentSum}.`
            };
        }

        return { isValid: true, totalWeight: currentSum };
    }
};

/**
 * Validates the schema integrity, primarily ensuring weights sum correctly and polarities are valid.
 * Throws an error on configuration failure.
 * @param {Object} schema 
 * @returns {string[]} Metric names
 */
function validateSchemaAndGetNames(schema) {
    const WEIGHT_TOLERANCE = 1e-9; 

    // 1. Validate Weight Summation using the dedicated tool
    const validationResult = WeightedSchemaValidator.execute({
        schema: schema,
        weightKey: 'weight',
        targetSum: 1.0,
        tolerance: WEIGHT_TOLERANCE,
    });

    if (!validationResult.isValid) {
        throw new Error(`[TC-SCHEMA ERROR] Initialization Failure: ${validationResult.error}`);
    }
    
    // 2. Validate Polarity
    const validPolarities = new Set([POSITIVE, NEGATIVE]);
    for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
            const item = schema[key];
            if (!validPolarities.has(item.polarity)) {
                 throw new Error(`[TC-SCHEMA ERROR] Invalid polarity value for metric '${key}': ${item.polarity}`);
            }
        }
    }

    return Object.keys(schema);
}

// Execute validation immediately upon module load
export const METRIC_NAMES = validateSchemaAndGetNames(SCHEMA_DEFINITION);

// Export the validated and frozen schema to enforce immutability.
export const TRUST_METRICS_SCHEMA = Object.freeze(SCHEMA_DEFINITION);
