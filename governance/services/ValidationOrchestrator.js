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
    #validators;
    /** @type {import('../plugins/TaskAggregator')} */
    #aggregator;

    // --- Private I/O Proxies ---

    #throwDependencyError(message) {
        throw new Error(`[ValidationOrchestrator] Dependency Error: ${message}`);
    }

    #throwRegistrationError(message) {
        // This encapsulates the throwing mechanism for registration failures.
        throw new Error(message);
    }

    #logRegistration(validatorInstance) {
        // I/O Proxy for logging registration event (currently silent, ready for debug implementation).
        // console.debug(`[ValidationOrchestrator] Registered validator: ${validatorInstance.constructor.name}`);
    }

    #delegateToAggregatorExecution(promises) {
        // Crucial I/O delegation to the external TaskAggregator tool
        return this.#aggregator.execute(promises);
    }

    // --- Setup and Initialization ---

    /**
     * Extracts synchronous dependency resolution and initialization logic.
     * @param {object} dependencies 
     */
    #setupDependencies(dependencies) {
        // Use TaskAggregator interface. Support legacy name during transition.
        const aggregator = dependencies.TaskAggregator || dependencies.ConcurrentTaskAggregatorTool;

        if (!aggregator) {
            this.#throwDependencyError("TaskAggregator tool instance is missing.");
        }

        this.#aggregator = aggregator;
        this.#validators = [];
    }

    // --- Public API ---

    /**
     * @param {object} dependencies - Dependencies injected by the system.
     * @param {object} dependencies.TaskAggregator - The tool instance for concurrent execution and result aggregation.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Registers a concrete governance validator module.
     * @param {ConfigValidator} validatorInstance - An instance of a concrete ConfigValidator subclass.
     */
    registerValidator(validatorInstance) {
        // Enforce duck typing check for the required 'validate' method.
        if (typeof validatorInstance.validate !== 'function') {
            this.#throwRegistrationError("Attempted to register object lacking the required 'validate' method (ConfigValidator interface).");
        }
        this.#validators.push(validatorInstance);
        this.#logRegistration(validatorInstance);
    }

    /**
     * Executes all registered validators against the proposed configuration concurrently.
     * @param {Object} config - The configuration payload to validate.
     * @returns {Promise<ValidationResult>} Unified validation results.
     */
    async validateSystemConfig(config) {
        if (this.#validators.length === 0) {
            // Default success when no rules are registered.
            return { isValid: true, errors: [] };
        }

        // 1. Map validators to promises (tasks)
        const promises = this.#validators.map(v => v.validate(config));

        // 2. Use the injected tool to execute concurrently and aggregate results via I/O proxy.
        const finalResult = await this.#delegateToAggregatorExecution(promises);

        return finalResult;
    }
}

module.exports = ValidationOrchestrator;