/**
 * Governance Settings Configuration Provider (v94.1 - Refactored)
 * Focuses purely on schema definition and integration with the centralized configuration loader.
 * Configuration values are sourced from process.env and guaranteed immutable upon loading.
 */

const { loadConfigFromSchema } = require('../utils/configUtils');

// --- Configuration Schema Metadata Definition ---

const GOVERNANCE_SCHEMA = {
    // Key: { default: Value, env: 'ENV_KEY', type: 'type' }

    GHM_LATENCY_THRESHOLD_MS: { default: 500, env: 'GHM_LATENCY_MS', type: 'int' },
    GHM_SMOOTHING_ALPHA: { default: 0.15, env: 'GHM_SMOOTHING_ALPHA', type: 'float' },
    GHM_MINIMUM_READINESS_THRESHOLD: { default: 0.85, env: 'GHM_MIN_READINESS', type: 'float' },
    GHM_MAX_VIOLATIONS_TOLERANCE: { default: 5, env: 'GHM_MAX_VIOLATIONS', type: 'int' },
    GHM_HEALTH_MONITOR_ENABLED: { default: true, env: 'GHM_MONITOR_ENABLED', type: 'bool' },
    
    GHM_COMPONENT_CRITICALITY_WEIGHTS: {
        default: {
            mcraEngine: 1.5,
            atmSystem: 1.0,
            policyEngine: 1.2
        },
        env: 'GHM_CRITICALITY_WEIGHTS_JSON',
        type: 'object'
    },
};

/**
 * Initializes and finalizes the system governance configuration.
 * Uses the dedicated utility to load settings, apply overrides, and enforce immutability.
 */
const GOVERNANCE_SETTINGS = loadConfigFromSchema(GOVERNANCE_SCHEMA, process.env);

module.exports = {
    GOVERNANCE_SETTINGS,
    /** 
     * Retrieves a governance setting.
     * @param {string} key
     * @returns {*} The configuration value (immutable).
     */
    getSetting: (key) => {
        if (!GOVERNANCE_SETTINGS.hasOwnProperty(key)) {
            // Log warning if accessing an undocumented/non-existent setting
            console.warn(`GHM: Attempted to access unknown governance setting: ${key}`);
        }
        return GOVERNANCE_SETTINGS[key];
    }
};
