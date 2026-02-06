/**
 * Governance Settings Configuration Provider (v94.1)
 * Manages access to system-wide Governance Health Monitor (GHM) parameters.
 * Designed for dynamic configuration merging (Defaults -> Environment -> Remote Store).
 */

const GHM_CONFIG_DEFAULTS = {
    // Latency: Max acceptable latency for core operational pipelines (in ms).
    GHM_LATENCY_THRESHOLD_MS: 500,

    // Smoothing: Alpha factor (0.0 to 1.0) for Exponential Weighted Moving Average (EWMA) of the Governance Rating Score (GRS).
    GHM_SMOOTHING_ALPHA: 0.15,

    // Readiness: Minimum acceptable GRS required for activating system readiness protocols (e.g., serving external requests).
    GHM_MINIMUM_READINESS_THRESHOLD: 0.85,

    // Weights: Default criticality weights for key sub-components used in composite GRS calculation.
    GHM_COMPONENT_CRITICALITY_WEIGHTS: {
        mcraEngine: 1.5, // Mission Critical Resource Allocation
        atmSystem: 1.0,  // Adaptive Threat Modeling
        policyEngine: 1.2
    },

    // Policy: Maximum number of minor violations before initiating automatic rollback/recalibration.
    GHM_MAX_VIOLATIONS_TOLERANCE: 5,
};

/**
 * Merges configuration sources (Defaults <- Environment/Runtime Overrides).
 * NOTE: In a complete implementation, this function would handle remote K/V fetching and validation.
 * @returns {object} The finalized, validated governance configuration.
 */
function initializeGovernanceSettings() {
    let settings = { ...GHM_CONFIG_DEFAULTS };

    // Placeholder for Environment Variable Overrides
    // e.g., if (process.env.GHM_LATENCY_MS) { settings.GHM_LATENCY_THRESHOLD_MS = parseInt(process.env.GHM_LATENCY_MS, 10); }
    
    // --- Future Integration Point: Load remote config & call validation service (e.g., validateConfig(settings)) ---

    // Freeze the object to prevent runtime modification (enhancing governance integrity).
    return Object.freeze(settings);
}

// Immediately load and freeze the settings upon module import.
const GOVERNANCE_SETTINGS = initializeGovernanceSettings();

module.exports = {
    GOVERNANCE_SETTINGS,
    // Utility export for easy key access, prioritizing immutability.
    getSetting: (key) => GOVERNANCE_SETTINGS[key]
};