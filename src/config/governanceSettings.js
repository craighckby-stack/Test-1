/**
 * Governance Settings Configuration Management
 * Centralizes tunable parameters for the Governance Health Monitor (GHM) and related components.
 * In a production AGI deployment, this utility would interface with a dynamic config service (e.g., Consul, K/V store).
 */

const GovernanceDefaults = {
    // GHM: Maximum acceptable latency for core operations (in ms).
    GHM_LATENCY_THRESHOLD_MS: 500,

    // GHM: Alpha factor (0.0 to 1.0) for EWMA smoothing of the GRS.
    GHM_SMOOTHING_ALPHA: 0.15,

    // GSEP: Minimum acceptable GRS for system readiness protocols.
    GHM_MINIMUM_READINESS_THRESHOLD: 0.85,

    // GHM: Default weights for calculating the composite GRS (based on component criticality).
    GHM_COMPONENT_WEIGHTS: {
        mcraEngine: 1.5, 
        atmSystem: 1.0,
        policyEngine: 1.2
    },
};

/**
 * Utility function to load current settings. Allows the Governance system
 * to abstract configuration loading, paving the way for dynamic reconfiguration.
 * @returns {object} Current Governance Settings.
 */
function loadGovernanceSettings() {
    // --- Configuration Fetch Logic Placeholder ---
    // Placeholder: Return defaults. Future version will load overrides from external source.
    return GovernanceDefaults;
}

module.exports = {
    loadGovernanceSettings
};