/**
 * NOTE: The DeepInitializer utility is now provided by the kernel via the
 * 'DeepInitializer' plugin interface, abstracting complex recursive merge logic.
 */

class ConfigurationIntegrityService {
    /**
     * @param {object} config.schema - Joi/Zod like schema definition.
     * @param {object} config.defaults - Default values for the configuration structure.
     * @param {function[]} config.policies - Array of functions to enforce runtime constraints.
     */
    constructor({ schema, defaults, policies = [] }) {
        if (!schema || typeof schema !== 'object') {
            throw new Error('ConfigurationIntegrityService requires a valid schema definition.');
        }

        this.schema = schema;
        this.defaults = defaults;
        this.policies = policies;
    }

    /**
     * Validates a configuration object against the defined schema.
     * Throws an error if validation fails.
     * @param {object} config - The configuration object to validate.
     * @returns {object} The validated configuration object.
     */
    validate(config) {
        // Using a placeholder robust validation function signature
        const validationResult = this._internalSchemaValidator(config, this.schema);

        if (validationResult.error) {
            throw new Error(`Configuration Validation Failed: ${validationResult.error.message}`);
        }

        return validationResult.value;
    }

    /**
     * Migrates the configuration: ensures defaults are applied and structure is initialized.
     * This method handles structural integrity before validation using the DeepInitializer plugin.
     * @param {object} config - The raw configuration object.
     * @returns {object} The migrated and initialized configuration object.
     */
    migrate(config) {
        // Step 1: Initialize structural integrity using deep recursion (via the plugin)
        // Assumes DeepInitializer is globally available/injected by the AGI-KERNEL.
        const initializedConfig = DeepInitializer(config, this.defaults);

        // Step 2: Apply specific version migrations if necessary (placeholder logic)
        // if (initializedConfig.version < TARGET_VERSION) { ... apply patch ... }

        return initializedConfig;
    }

    /**
     * Enforces runtime policies (e.g., dynamic constraints, limits, environment-specific overrides).
     * Policies are functions that take config and return the modified config.
     * @param {object} config - The configuration object (usually post-validation/migration).
     * @returns {object} The configuration object with policies applied.
     */
    enforce(config) {
        let enforcedConfig = { ...config };

        for (const policy of this.policies) {
            if (typeof policy !== 'function') {
                console.warn('Skipping non-function policy encountered.');
                continue;
            }
            try {
                enforcedConfig = policy(enforcedConfig);
                if (!enforcedConfig) {
                    throw new Error('Policy execution returned a falsy value. Must return the updated config.');
                }
            } catch (error) {
                // Fail fast on policy breaches or internal policy errors
                throw new Error(`Policy enforcement failed during execution: ${error.message}`);
            }
        }

        return enforcedConfig;
    }

    /**
     * Private placeholder for complex schema validation logic.
     * Mocked here to satisfy method requirement.
     */
    _internalSchemaValidator(config, schema) {
        if (schema && typeof config !== 'object') {
             return { error: { message: 'Config must be an object' }, value: null };
        }
        return { error: null, value: config };
    }
}

module.exports = ConfigurationIntegrityService;