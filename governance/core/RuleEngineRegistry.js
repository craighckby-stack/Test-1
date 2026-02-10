const { ValidationResult } = require('../interfaces/ConfigValidator');

/**
 * @typedef {object} ValidationResult
 * @property {boolean} isValid
 * @property {Array<any>} errors
 */

/**
 * Manages the collection and concurrent execution of individual validation rules.
 * This decouples specific validation logic (e.g., SchemaCheck, StabilityCheck) 
 * from the main ConfigValidator implementation.
 */
class RuleEngineRegistry {
    constructor() {
        /** @type {Array<Object>} */
        this.rules = [];
        
        // Assuming runtime access to the AGI-KERNEL plugin registry
        // Note: In a real environment, this dependency would be injected.
        this.aggregatorTool = global.AGI_KERNEL_TOOLS ? global.AGI_KERNEL_TOOLS.ConcurrentValidationAggregator : null;
    }

    /**
     * Registers a new validation rule module.
     * A rule module must implement an async 'execute(config)' method 
     * that returns a structured ValidationResult segment.
     * @param {Object} ruleModule - An instance of a rule implementation implementing { execute(config) }.
     */
    registerRule(ruleModule) {
        if (typeof ruleModule.execute !== 'function') {
            throw new Error(`Rule module ${ruleModule.constructor.name} must implement an async 'execute(config)' method.`);
        }
        this.rules.push(ruleModule);
    }

    /**
     * Executes all registered rules concurrently against the configuration using the extracted tool.
     * @param {Object} config - The configuration object to validate.
     * @returns {Promise<ValidationResult>} Aggregated validation result.
     */
    async runAll(config) {
        if (!this.aggregatorTool || typeof this.aggregatorTool.execute !== 'function') {
            // Fallback: Execute original logic if plugin is unavailable (for robustness)
            if (this.rules.length === 0) {
                return { isValid: true, errors: [] };
            }
    
            // Execute all rules in parallel
            const validationPromises = this.rules.map(rule => rule.execute(config));
    
            // Wait for all results and aggregate
            const results = await Promise.all(validationPromises);
    
            let allErrors = [];
            let globalIsValid = true;
    
            for (const result of results) {
                if (result && result.isValid === false) {
                    globalIsValid = false;
                    allErrors = allErrors.concat(Array.isArray(result.errors) ? result.errors : []);
                }
            }
    
            return { isValid: globalIsValid, errors: allErrors };
        }
        
        // Delegate the complex concurrent execution and aggregation logic to the plugin
        return this.aggregatorTool.execute({
            rules: this.rules,
            config: config
        });
    }
}

module.exports = RuleEngineRegistry;