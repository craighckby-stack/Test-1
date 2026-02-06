/**
 * Governance Settings Configuration Provider (v94.1)
 * Manages system-wide Governance Health Monitor (GHM) parameters.
 * Designed for strict configuration merging (Defaults -> Environment).
 * Utilizes a defensive approach with immutability and strict type coercion for environment variables.
 */

// --- Internal Helper for Environment Overrides ---

/**
 * Retrieves environment variable, applying type coercion or returning default.
 * Handles cases where env var is set but invalid (e.g., non-numeric string for a number field).
 */
const getEnvAsType = (key, defaultValue, type = 'string') => {
    const value = process.env[key];
    if (value === undefined || value === null) {
        return defaultValue;
    }

    switch (type.toLowerCase()) {
        case 'int':
            const i = parseInt(value, 10);
            return isNaN(i) ? defaultValue : i;
        case 'float':
            const f = parseFloat(value);
            return isNaN(f) ? defaultValue : f;
        // Note: For complex structures like weights, environment variable overrides are intentionally disabled
        // unless advanced JSON parsing and validation utility is guaranteed, prioritizing core governance stability.
        default:
            return value;
    }
};

// --- Default Configuration Definitions ---

const GHM_CONFIG_DEFAULTS = {
    // Latency (ms)
    GHM_LATENCY_THRESHOLD_MS: 500,

    // Smoothing Alpha (0.0 to 1.0)
    GHM_SMOOTHING_ALPHA: 0.15,

    // Readiness Score (0.0 to 1.0)
    GHM_MINIMUM_READINESS_THRESHOLD: 0.85,

    // Component Weights (used in GRS calculation)
    GHM_COMPONENT_CRITICALITY_WEIGHTS: {
        mcraEngine: 1.5,
        atmSystem: 1.0,
        policyEngine: 1.2
    },

    // Violation Tolerance (count)
    GHM_MAX_VIOLATIONS_TOLERANCE: 5,
};

/**
 * Merges configuration sources and finalizes configuration.
 * @returns {object} The finalized, immutable governance configuration.
 */
function initializeGovernanceSettings() {
    let settings = { ...GHM_CONFIG_DEFAULTS };

    // 1. Apply Environment Overrides with Defensive Type Coercion
    settings.GHM_LATENCY_THRESHOLD_MS = getEnvAsType(
        'GHM_LATENCY_MS', settings.GHM_LATENCY_THRESHOLD_MS, 'int'
    );
    settings.GHM_SMOOTHING_ALPHA = getEnvAsType(
        'GHM_SMOOTHING_ALPHA', settings.GHM_SMOOTHING_ALPHA, 'float'
    );
    settings.GHM_MINIMUM_READINESS_THRESHOLD = getEnvAsType(
        'GHM_MIN_READINESS', settings.GHM_MINIMUM_READINESS_THRESHOLD, 'float'
    );
    settings.GHM_MAX_VIOLATIONS_TOLERANCE = getEnvAsType(
        'GHM_MAX_VIOLATIONS', settings.GHM_MAX_VIOLATIONS_TOLERANCE, 'int'
    );

    // 2. Future Hook: Integrate call to validateGovernanceSettings() here after remote fetch.

    // 3. Freeze the object to ensure deep immutability.
    return Object.freeze(settings);
}

const GOVERNANCE_SETTINGS = initializeGovernanceSettings();

module.exports = {
    GOVERNANCE_SETTINGS,
    /** @param {string} key */
    getSetting: (key) => GOVERNANCE_SETTINGS[key]
};