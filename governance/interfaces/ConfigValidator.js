/**
 * @typedef {Object} ValidationError
 * @property {string} ruleId - Identifier of the rule that failed (e.g., 'GRS-001', 'SchemaCheck').
 * @property {string} message - Human-readable description of the failure.
 * @property {string} [path] - Optional JSON path to the failed configuration element (e.g., 'rules[3].threshold').
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - True if the configuration passed all checks.
 * @property {ValidationError[]} errors - Array of detailed errors if validation failed.
 */

/**
 * Abstract Base Class: ConfigValidator
 * ID: ConfigValidator (A formalized API based on original RGCM requirements)
 * Scope: Standardized, Asynchronous Interface
 *
 * Purpose: Defines the required contract for all concrete governance configuration validation modules.
 * Concrete implementations must provide detailed, asynchronous validation against current policy sets.
 */
class ConfigValidator {
    constructor() {
        // Enforce abstract nature
        if (new.target === ConfigValidator) {
            throw new TypeError("Cannot instantiate abstract class ConfigValidator directly.");
        }
    }

    /**
     * Asynchronously validates the proposed configuration payload against all current Governance Rule Sets (GRS).
     *
     * Rationale: Validation should return detailed feedback (errors) rather than just a boolean, 
     * and should be asynchronous to handle complex checks (e.g., database lookup, external state integrity).
     *
     * @param {Object} config - The configuration object (e.g., RTPCM policy update payload) to validate.
     * @returns {Promise<ValidationResult>} A promise resolving to a detailed validation result object.
     * @abstract
     */
    async validate(config) {
        // This method must be implemented by concrete governance rule checking modules (e.g., GRCM_v1.js).
        throw new Error("Abstract method 'validate(config)' must be implemented by concrete subclasses.");
    }
}

module.exports = ConfigValidator;