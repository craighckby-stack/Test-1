/**
 * Component ID: SCR
 * System Configuration Registry (SCR)
 * 
 * Responsibility: Centralized, versioned registry for system-wide constants, thresholds, and learned weights.
 * Allows governing components (like SEA, FBA, C-13) to access and, crucially, allows Adaptive
 * Weight Learning Models to dynamically adjust parameters based on historical performance.
 */

class SystemConfigurationRegistry {
    constructor() {
        this.config = {
            // Systemic Entropy Auditor (SEA) Tunables
            'SEA_WEIGHTS': {
                COUPLING_FACTOR: 0.45,
                COMPLEXITY_STRAIN: 0.30,
                GOVERNANCE_OVERHEAD: 0.25
            },
            'SEA_THRESHOLDS': {
                WARNING: 0.60,
                CRITICAL: 0.85
            },
            
            // ... other global parameters (FBA coefficients, learning rates, etc.)
        };
    }

    get(key) {
        return this.config[key];
    }

    /**
     * Used by Adaptive Learning Modules to update system parameters.
     * Requires high governance access and logging.
     * @param {string} key Configuration key (e.g., 'SEA_WEIGHTS')
     * @param {Object} value New configuration object.
     */
    set(key, value) {
        if (!this.config.hasOwnProperty(key)) {
            console.error(`[SCR] Attempted to set non-existent configuration key: ${key}`);
            return false;
        }
        // NOTE: In production AGI, this must trigger extensive logging and validation.
        this.config[key] = value;
        return true;
    }
}

module.exports = SystemConfigurationRegistry;