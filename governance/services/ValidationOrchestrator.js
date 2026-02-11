/**
 * @fileoverview Manages and orchestrates the execution of multiple concrete ConfigValidator implementations.
 * Logic for concurrent execution and result aggregation is delegated to the TaskAggregator tool (plugin).
 */

const { ConfigValidator, ValidationResult } = require('../interfaces/ConfigValidator');

/**
 * Service responsible for registering Governance Rule Checking Modules (GRCMs)
 * and aggregating their validation results into a single system report.
 */
class ValidationOrchestrator {
    /** @type {ConfigValidator[]} */
    validators;
    /** @type {import('../plugins/TaskAggregator')} */
    #aggregator;

    /**
     * @param {object} dependencies - Dependencies injected by the system.
     * @param {object} dependencies.TaskAggregator - The tool instance for concurrent execution and result aggregation.
     */
    constructor(dependencies) {
        // Use TaskAggregator interface. Support legacy name during transition.
        this.#aggregator = dependencies.TaskAggregator || dependencies.ConcurrentTaskAggregatorTool;
        this.validators = [];

        if (!this.#aggregator) {
            throw new Error("[ValidationOrchestrator] Dependency Error: TaskAggregator tool instance is missing.");
        }
    }

    /**
     * Registers a concrete governance validator module.
     * @param {ConfigValidator} validatorInstance - An instance of a concrete ConfigValidator subclass.
     */
    registerValidator(validatorInstance) {
        // Enforce duck typing check for the required 'validate' method.
        if (typeof validatorInstance.validate !== 'function') {
            throw new Error("Attempted to register object lacking the required 'validate' method (ConfigValidator interface).");
        }
        this.validators.push(validatorInstance);
        // console.debug(`[ValidationOrchestrator] Registered validator: ${validatorInstance.constructor.name}`);
    }

    /**
     * Executes all registered validators against the proposed configuration concurrently.
     * @param {Object} config - The configuration payload to validate.
     * @returns {Promise<ValidationResult>} Unified validation results.
     */
    async validateSystemConfig(config) {
        if (this.validators.length === 0) {
            // Default success when no rules are registered.
            return { isValid: true, errors: [] };
        }

        // 1. Map validators to promises (tasks)
        const promises = this.validators.map(v => v.validate(config));

        // 2. Use the injected tool to execute concurrently and aggregate results.
        // The TaskAggregator handles Promise.allSettled and subsequent reduction.
        const finalResult = await this.#aggregator.execute(promises);

        return finalResult;
    }
}

module.exports = ValidationOrchestrator;