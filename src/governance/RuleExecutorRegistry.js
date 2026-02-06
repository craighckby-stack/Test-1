/**
 * G-03 Rule Executor Registry
 *
 * Role: A centralized registry responsible for storing, managing, and executing all specific
 * GSEP compliance and invariant checks. It decouples the M-02 Mutation Pre-Processor
 * from the implementation details of any single check, ensuring high scalability and maintainability.
 * It now enforces strict structured results and supports both synchronous and asynchronous rule execution.
 */

/**
 * @typedef {object} RuleResult
 * @property {boolean} compliant - True if the rule passed.
 * @property {string} message - A human-readable description of the outcome.
 * @property {string} code - The unique identifier of the rule that was executed.
 * @property {('NORMAL'|'FATAL_INTERNAL')} [severity='NORMAL'] - Indication of operational status (used primarily for internal errors).
 * @property {object} [details] - Optional context or debug information.
 */

class RuleExecutorRegistry {
    
    /** @type {Map<string, function(payload: object, config: object, context: object): (Promise<RuleResult>|RuleResult)>} */
    #executors;

    /**
     * Initializes the registry. Designed to accept an optional array of rule definitions
     * for cleaner dependency injection.
     * @param {Array<{code: string, handler: function}>} [initialRules=[]] - Rules to pre-load.
     */
    constructor(initialRules = []) {
        this.#executors = new Map();
        this._loadInitialRules(initialRules);
    }

    /**
     * Loads rules from a definition array.
     * @param {Array<{code: string, handler: function}>} rules 
     */
    _loadInitialRules(rules) {
        for (const rule of rules) {
            this.register(rule.code, rule.handler);
        }
    }

    /**
     * Registers a specific check handler function.
     * @param {string} checkCode - Unique identifier for the rule (e.g., 'DEPENDENCY_INTEGRITY').
     * @param {function(payload: object, config: object, context: object): (Promise<RuleResult>|RuleResult)} handler - The function that returns a structured RuleResult.
     */
    register(checkCode, handler) {
        if (typeof handler !== 'function') {
            throw new Error(`Rule handler for ${checkCode} must be a function.`);
        }
        this.#executors.set(checkCode, handler);
    }

    /**
     * Executes the specific check identified by checkCode.
     *
     * @param {string} checkCode
     * @param {object} payload - Mutation payload.
     * @param {object} config - Rule-specific configuration (from invariants).
     * @param {object} context - Current operational context.
     * @returns {Promise<RuleResult>} Structured Rule Result.
     */
    async execute(checkCode, payload, config = {}, context = {}) {
        const handler = this.#executors.get(checkCode);
        const logContext = { checkCode, payload, config, context }; 

        if (!handler) {
            console.warn(`[G-03] Operational Fault: Registry missing mandatory handler for check code: ${checkCode}.`);
            return this._createFaultResult(
                checkCode,
                `Operational fault: No registered handler found for ${checkCode}. Evaluation aborted.`,
                logContext
            );
        }

        try {
            // Use Promise.resolve() to wrap both synchronous and asynchronous handlers seamlessly.
            /** @type {RuleResult} */
            let result = await Promise.resolve(handler(payload, config, context));

            // Strict Validation: Enforce the required RuleResult structure.
            if (
                typeof result === 'object' && result !== null &&
                typeof result.compliant === 'boolean' && typeof result.message === 'string'
            ) {
                // Ensure the 'code' is attached/overwritten for strict consistency.
                return { ...result, code: checkCode };
            }
            
            // Fault if the handler returns an unrecognizable object structure.
            throw new Error(`Handler returned an invalid structure. Must contain { compliant: boolean, message: string }. Received type: ${typeof result}`);
            
        } catch (error) {
            console.error(`[G-03] Rule Execution Exception (${checkCode}) - Handler Failed:`, error.message);
            return this._createFaultResult(
                checkCode,
                `Internal handler error: ${error.message}`,
                { error: error.stack, context: logContext }
            );
        }
    }

    /**
     * Helper to create a consistent failure result template for internal errors or missing handlers.
     * @private
     * @param {string} code 
     * @param {string} message 
     * @param {object} details 
     * @returns {RuleResult}
     */
    _createFaultResult(code, message, details) {
        return {
            compliant: false,
            message: message,
            code: code,
            severity: 'FATAL_INTERNAL',
            details: details
        };
    }
}

module.exports = RuleExecutorRegistry;
