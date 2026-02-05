// Governance Rule Configuration Validator Interface/Stub
// ID: ConfigValidator (A formalized API based on original RGCM requirements)
// Scope: Standard Interface

/**
 * Interface definition for systems validating governance configuration payload (like RTPCM policy updates).
 * All governance validation modules must implement this contract.
 */
class ConfigValidator {
    /**
     * Validates the proposed configuration against all current Governance Rule Sets (GRS).
     * @param {Object} config - The configuration object to validate.
     * @returns {boolean} True if the configuration adheres to all schema and stability rules.
     */
    validate(config) {
        // This method must be implemented by concrete governance rule checking modules (e.g., GRCM_v1.js).
        throw new Error("Abstract method 'validate' must be implemented by concrete governance validators.");
    }
    
    // Static methods or additional interfaces for schema retrieval can be added later.
}

module.exports = ConfigValidator;