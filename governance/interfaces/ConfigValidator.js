/**
 * @fileoverview Defines the abstract interface for configuration validation within the Governance Subsystem.
 */

/**
 * Core Interface Type: ValidationError
 * @typedef {Object} ValidationError
 * @property {string} ruleId - Identifier of the rule that failed (e.g., 'GRS-001', 'SchemaCheck').
 * @property {string} message - Human-readable description of the failure.
 * @property {string} [path] - Optional JSON path to the failed configuration element (e.g., 'rules[3].threshold').
 * @property {*} [value] - Optional failing value for better debugging.
 */

/**
 * Core Interface Type: ValidationResult
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - True if the configuration passed all checks.
 * @property {ValidationError[]} errors - Array of detailed errors if validation failed.
 */

/**
 * Abstract Base Class: ConfigValidator
 * ID: GOV_IFACE_VLDTR_v1
 * Scope: Standardized, Asynchronous Interface for Configuration Integrity Checks.
 *
 * Purpose: Defines the required contract for all concrete governance configuration validation modules (GRCMs).
 */
class ConfigValidator {
    /**
     * Static unique identifier for introspection and registry management.
     * @type {string}
     */
    static INTERFACE_ID = 'GOV_IFACE_VLDTR_v1';

    constructor() {
        // Enforce abstract nature
        if (new.target === ConfigValidator) {
            throw new TypeError("Cannot instantiate abstract class ConfigValidator directly. Use concrete governance rule modules.");
        }
    }

    /**
     * Asynchronously validates the proposed configuration payload against applicable Governance Rule Sets.
     *
     * Rationale: The operation is asynchronous to accommodate complex checks requiring state lookups,
     * dependency analysis, or cryptographic verification.
     *
     * @param {Object} config - The configuration object (e.g., policy update payload) to validate.
     * @returns {Promise<ValidationResult>} A promise resolving to a detailed validation result object.
     * @abstract
     */
    async validate(config) {
        // This method must be implemented by concrete governance rule checking modules (GRCMs).
        throw new Error("Abstract method 'validate(config)' must be implemented by concrete subclasses.");
    }
}

/**
 * Exports the ConfigValidator interface and associated types.
 */
module.exports = {
    ConfigValidator,
    /** @typedef {ValidationError} */
    ValidationError,
    /** @typedef {ValidationResult} */
    ValidationResult,
};
