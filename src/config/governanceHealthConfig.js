/**
 * @typedef {object} ComponentHealthConfig
 * @property {number} weight - Weight assigned to this component (higher means greater impact on overall GRS).
 * @property {number} latencyThresholdMs - Maximum acceptable latency in milliseconds for this component.
 */

/**
 * Configuration schema for the Governance Health Monitor (GHM).
 * Defines specific thresholds and weights for critical OGT components, decoupling these parameters from monitoring code.
 * This configuration drives the calculation of the Governance Readiness Signal (GRS).
 */
const GovernanceHealthConfig = {
    // === Global Monitoring Thresholds ===
    
    /** 
     * Default fallback latency threshold applied if a component lacks a specific override. 
     */
    globalLatencyThresholdMs: 450, 

    /** 
     * Standard Governance Readiness Signal (GRS) requirement for system deployment stage (e.g., GSEP Stage 3). 
     * If the calculated GRS falls below this value, the system is deemed non-compliant.
     */
    minimumGRSThreshold: 0.88, 

    // === Component-Specific Overrides and Weights ===
    /**
     * @type {Object.<string, ComponentHealthConfig>}
     * Map of OGT components to their specific monitoring parameters.
     */
    components: {
        mcraEngine: {
            weight: 3.0, 
            // Requires fast response
            latencyThresholdMs: 250 
        },
        atmSystem: {
            weight: 2.0, 
            latencyThresholdMs: 500
        },
        policyEngine: {
            weight: 1.5, 
            latencyThresholdMs: 600
        },
        auditLogger: {
            weight: 0.5, 
            latencyThresholdMs: 1000 
        }
    }
};

module.exports = GovernanceHealthConfig;
