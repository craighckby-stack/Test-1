/**
 * CFTMValidator
 * Ensures the Core Failure Thresholds Manifest adheres to the strict governance schema
 * before ingestion by the CFTMAccessor. Separates structural validation from runtime access.
 * This utility handles external data integrity (e.g., versioning, required keys, format).
 */

const CFTMConfigurationError = require('./cftm_accessor').CFTMConfigurationError; 

// NOTE: RequiredKeys remains local as it defines the specific mandate for this component.
const RequiredKeys = [
    'DENOMINATOR_STABILITY_TAU',
    'MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON',
    // Add all critical mandated keys here
];

// AGI-KERNEL: Conceptual interface for the extracted tool.
// In a production environment, this would be injected or imported from the AGI plugin system.
const MandatedThresholdsStructureValidator = {
    // execute: (rawConfig: object, requiredKeys: string[]) => object
    execute: (rawConfig, requiredKeys) => { 
        // Placeholder logic until actual injection occurs
        throw new Error("MandatedThresholdsStructureValidator plugin call failed: Tool not initialized.");
    }
};

class CFTMValidator {
    /**
     * Validates the structure and presence of mandated constants in the raw manifest.
     * Delegates structural checks to the MandatedThresholdsStructureValidator plugin.
     * @param {object} rawConfig - The object containing the 'thresholds' property.
     * @throws {CFTMConfigurationError} if validation fails.
     * @returns {object} The validated configuration object.
     */
    static validateManifest(rawConfig) {
        try {
            // Delegate core structural validation to the extracted tool.
            return MandatedThresholdsStructureValidator.execute(rawConfig, RequiredKeys);
        } catch (e) {
            // The tool throws a generic Error object potentially containing 'key' metadata.
            // We catch it and re-wrap it in the domain-specific CFTMConfigurationError.
            if (e instanceof Error) {
                // If the error object has custom key metadata, pass it along
                if (e.key) {
                    throw new CFTMConfigurationError(e.message, e.key);
                }
                // Otherwise, wrap the standard message
                throw new CFTMConfigurationError(e.message);
            }
            // Re-throw unhandled exceptions
            throw e;
        }
    }
}

module.exports = CFTMValidator;