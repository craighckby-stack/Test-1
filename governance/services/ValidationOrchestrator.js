/**
 * @fileoverview Manages and orchestrates the execution of multiple concrete ConfigValidator implementations.
 * Logic for concurrent execution and result aggregation is delegated to the ConcurrentTaskAggregatorTool.
 */

const { ConfigValidator, ValidationResult } = require('../interfaces/ConfigValidator');

/**
 * Service responsible for registering Governance Rule Checking Modules (GRCMs)
 * and aggregating their validation results into a single system report.
 */
class ValidationOrchestrator {
    /** @type {ConfigValidator[]} */
    validators;
    /** @type {object} */
    #aggregator;

    /**
     * @param {object} dependencies - Dependencies injected by the system.
     * @param {object} dependencies.ConcurrentTaskAggregatorTool - The tool instance for aggregation.
     */
    constructor(dependencies) {
        this.validators = [];
        this.#aggregator = dependencies.ConcurrentTaskAggregatorTool;

        if (!this.#aggregator) {
            console.error("[ValidationOrchestrator] Initialization error: ConcurrentTaskAggregatorTool dependency missing.");
        }
    }

    /**
     * Registers a concrete governance validator module.
     * @param {ConfigValidator} validatorInstance - An instance of a concrete ConfigValidator subclass.
     */
    registerValidator(validatorInstance) {
        // Note: Retaining original type check for interface compatibility, 
        // assuming ConfigValidator is available or using duck typing if not defined.
        if (typeof ConfigValidator !== 'undefined' && !(validatorInstance instanceof ConfigValidator)) {
            throw new Error("Attempted to register non-ConfigValidator object.");
        }
        this.validators.push(validatorInstance);
        console.log(`[ValidationOrchestrator] Registered validator: ${validatorInstance.constructor.name}`);
    }

    /**
     * Executes all registered validators against the proposed configuration concurrently.
     * @param {Object} config - The configuration payload to validate.
     * @returns {Promise<ValidationResult>} Unified validation results.
     */
    async validateSystemConfig(config) {
        if (this.validators.length === 0) {
            console.warn("[ValidationOrchestrator] No validators registered. Configuration passed by default.");
            return { isValid: true, errors: [] };
        }

        if (!this.#aggregator) {
            throw new Error("Orchestrator is not properly configured. Aggregator tool is missing.");
        }

        // 1. Map validators to promises (tasks)
        const promises = this.validators.map(v => v.validate(config));

        // 2. Use the injected tool to execute concurrently and aggregate results
        // The tool handles Promise.allSettled, error aggregation, and rejection handling.
        const finalResult = await this.#aggregator.execute(promises);

        return finalResult;
    }
}

module.exports = ValidationOrchestrator;
