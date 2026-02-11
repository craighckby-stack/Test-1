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
    /**
     * @param {Object} [aggregatorTool] - Optional dependency injection for the concurrent execution aggregator.
     */
    constructor(aggregatorTool) {
        /** @type {Array<Object>} */
        this.rules = [];
        
        // Use injected tool or look up globally, preferring injection for testability.
        // Note: The dependency is now strictly required for runAll to function.
        this.aggregatorTool = aggregatorTool || (global.AGI_KERNEL_TOOLS ? global.AGI_KERNEL_TOOLS.ConcurrentValidationAggregator : null);
        
        if (!this.aggregatorTool) {
             console.warn("RuleEngineRegistry initialized without 'ConcurrentValidationAggregator' tool. Execution of runAll() will fail if rules are present.");
        }
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
     * Executes all registered rules concurrently against the configuration using the dedicated aggregator tool.
     * @param {Object} config - The configuration object to validate.
     * @returns {Promise<ValidationResult>} Aggregated validation result.
     */
    async runAll(config) {
        if (!this.aggregatorTool || typeof this.aggregatorTool.execute !== 'function') {
            throw new Error("Cannot run validations: Required ConcurrentValidationAggregator tool is unavailable or improperly defined.");
        }
        
        // Delegate the complex concurrent execution and aggregation logic to the plugin
        return this.aggregatorTool.execute({
            rules: this.rules,
            config: config
        });
    }
}

module.exports = RuleEngineRegistry;