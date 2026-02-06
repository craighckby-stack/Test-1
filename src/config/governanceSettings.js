/**
 * Governance Settings Configuration Provider (v94.1 - Refactored)
 * Manages system-wide Governance Health Monitor (GHM) parameters.
 * Utilizes a structured schema and automated type coercion for environment overrides.
 */

// --- Internal Helper for Defensive Type Coercion ---

/**
 * Safely coerces a string value (typically from process.env) to the required type.
 * Handles number parsing (int/float), robust boolean checks, and defaults if invalid.
 */
const coerceValue = (value, type, defaultValue) => {
    if (value === undefined || value === null) {
        return defaultValue;
    }

    const val = String(value).trim();
    if (val === '') {
        return defaultValue;
    }

    switch (type.toLowerCase()) {
        case 'int':
            const i = parseInt(val, 10);
            return isNaN(i) ? defaultValue : i;
        case 'float':
            const f = parseFloat(val);
            return isNaN(f) ? defaultValue : f;
        case 'bool':
            // Robust boolean checking
            if (['true', '1', 't', 'y', 'yes'].includes(val.toLowerCase())) {
                return true;
            }
            if (['false', '0', 'f', 'n', 'no'].includes(val.toLowerCase())) {
                return false;
            }
            // If ENV value is ambiguous or invalid, return original default
            return defaultValue;
        default:
            return val; // String
    }
};

// --- Configuration Schema Metadata Definition ---

const GOVERNANCE_SCHEMA = {
    // Key: { default: Value, env: 'ENV_KEY', type: 'type' }

    GHM_LATENCY_THRESHOLD_MS: { default: 500, env: 'GHM_LATENCY_MS', type: 'int' },
    GHM_SMOOTHING_ALPHA: { default: 0.15, env: 'GHM_SMOOTHING_ALPHA', type: 'float' },
    GHM_MINIMUM_READINESS_THRESHOLD: { default: 0.85, env: 'GHM_MIN_READINESS', type: 'float' },
    GHM_MAX_VIOLATIONS_TOLERANCE: { default: 5, env: 'GHM_MAX_VIOLATIONS', type: 'int' },
    GHM_HEALTH_MONITOR_ENABLED: { default: true, env: 'GHM_MONITOR_ENABLED', type: 'bool' },
    
    // Complex Configuration Object (Not primitive ENV overrideable by default, requires dedicated JSON utility)
    GHM_COMPONENT_CRITICALITY_WEIGHTS: {
        default: {
            mcraEngine: 1.5,
            atmSystem: 1.0,
            policyEngine: 1.2
        },
        env: 'GHM_CRITICALITY_WEIGHTS_JSON', // Placeholder for future JSON coercion utility integration
        type: 'object'
    },
};

/**
 * Initializes and finalizes the system governance configuration.
 * Applies environment overrides based on the defined schema and enforces immutability.
 * @returns {object} The finalized, immutable governance configuration.
 */
function initializeGovernanceSettings() {
    const settings = {};

    for (const key in GOVERNANCE_SCHEMA) {
        const schema = GOVERNANCE_SCHEMA[key];
        const envValue = process.env[schema.env];

        if (schema.type === 'object') {
            // For complex objects, use the default and ensure it is defensively copied/frozen.
            // NOTE: Future integration point for src/utils/config/safeJsonCoercer.js
            let complexObject = schema.default;

            // Defensive deep copy before freezing sub-objects
            settings[key] = JSON.parse(JSON.stringify(complexObject));
            Object.freeze(settings[key]);
        }
        else if (schema.env) {
            // Apply defensive type coercion
            settings[key] = coerceValue(envValue, schema.type, schema.default);
        } else {
             // Simple assignment for non-env specific keys (should rarely happen with this schema approach)
             settings[key] = schema.default;
        }
    }

    // Final shallow freeze ensures top-level settings cannot be changed.
    return Object.freeze(settings);
}

const GOVERNANCE_SETTINGS = initializeGovernanceSettings();

module.exports = {
    GOVERNANCE_SETTINGS,
    /** @param {string} key */
    getSetting: (key) => GOVERNANCE_SETTINGS[key]
};