/**
 * Configuration Validator Utility
 * Ensures that governance configuration settings adhere to defined structural integrity 
 * and operational constraints (e.g., value ranges, types). Essential for applying configuration
 * loaded from untrusted or external dynamic sources.
 */

const CONFIG_CONSTRAINTS = {
    GHM_SMOOTHING_ALPHA: { type: 'number', min: 0.0, max: 1.0, required: true },
    GHM_MINIMUM_READINESS_THRESHOLD: { type: 'number', min: 0.0, max: 1.0, required: true },
    GHM_LATENCY_THRESHOLD_MS: { type: 'number', min: 50, required: true },
    GHM_MAX_VIOLATIONS_TOLERANCE: { type: 'number', min: 1, max: 100, required: true }
    // Note: Complex validation (e.g., structural validation of GHM_COMPONENT_CRITICALITY_WEIGHTS) would extend this mapping.
};

/**
 * Validates the provided configuration object against predefined constraints.
 * Throws an error if any constraint is violated.
 * @param {object} config - The merged configuration object to validate.
 */
function validateConfig(config) {
    const errors = [];

    for (const key in CONFIG_CONSTRAINTS) {
        const constraint = CONFIG_CONSTRAINTS[key];
        const value = config[key];

        if (constraint.required && (value === undefined || value === null)) {
            errors.push(`Config Error: Missing required setting: ${key}`);
            continue;
        }

        if (typeof value !== constraint.type) {
            errors.push(`Config Error: ${key} expected type ${constraint.type}, got ${typeof value}`);
        }
        
        // Check bounds
        if (constraint.min !== undefined && value < constraint.min) {
            errors.push(`Config Error: ${key} value ${value} is below minimum constraint ${constraint.min}`);
        }

        if (constraint.max !== undefined && value > constraint.max) {
            errors.push(`Config Error: ${key} value ${value} is above maximum constraint ${constraint.max}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Invalid Governance Configuration Detected:\n${errors.join('\n')}`);
    }

    return true;
}

module.exports = {
    validateConfig,
    CONFIG_CONSTRAINTS
};