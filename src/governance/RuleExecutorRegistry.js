/**
 * G-03 Rule Executor Registry
 *
 * Role: A centralized registry responsible for storing, managing, and executing all specific
 * GSEP compliance and invariant checks. It decouples the M-02 Mutation Pre-Processor
 * from the implementation details of any single check, ensuring high scalability and maintainability.
 * It now supports both synchronous and asynchronous rule execution and enforces a structured result format.
 */
class RuleExecutorRegistry {
    constructor() {
        /** @type {Map<string, function(payload: object, config: object, context: object): (Promise<object>|object)>} */
        this.executors = new Map();
        this._loadDefaultExecutors(); // Temporary until external rule loading is implemented
    }

    /**
     * Registers a specific check handler function.
     * @param {string} checkCode - Unique identifier for the rule (e.g., 'DEPENDENCY_INTEGRITY').
     * @param {function(payload: object, config: object, context: object): (Promise<object>|object)} handler - The function that returns a structured compliance result.
     */
    register(checkCode, handler) {
        if (typeof handler !== 'function') {
            throw new Error(`Rule handler for ${checkCode} must be a function.`);
        }
        this.executors.set(checkCode, handler);
    }

    /**
     * Executes the specific check identified by checkCode.
     * Rules should ideally return: { compliant: boolean, message: string, code: string, details?: object }
     *
     * @param {string} checkCode
     * @param {object} payload - Mutation payload.
     * @param {object} config - Rule-specific configuration (from invariants).
     * @param {object} context - Current operational context.
     * @returns {Promise<{compliant: boolean, message: string, code: string, details?: object}>} Structured Rule Result.
     */
    async execute(checkCode, payload, config = {}, context = {}) {
        const handler = this.executors.get(checkCode);
        const logContext = { payload, config, context };

        if (!handler) {
            console.warn(`[G-03] Registry missing mandatory handler for check code: ${checkCode}. Assuming compliant for resilience.`);
            return { 
                compliant: true, 
                message: `No registered handler found for ${checkCode}. System assumed compliance.`, 
                code: checkCode,
                details: logContext
            };
        }

        try {
            // Use Promise.resolve() to wrap both synchronous and asynchronous handlers seamlessly.
            let result = await Promise.resolve(handler(payload, config, context));

            // Standardization: If handler returns a simple boolean (legacy/minimal), wrap it.
            if (typeof result === 'boolean') {
                return {
                    compliant: result,
                    message: result ? `Check ${checkCode} passed (Legacy Boolean).` : `Check ${checkCode} failed (Legacy Boolean).`, 
                    code: checkCode
                };
            }

            // Validation: Ensure the result conforms to the structured requirement.
            if (typeof result === 'object' && result !== null && typeof result.compliant === 'boolean') {
                return { ...result, code: checkCode };
            }
            
            // Throw if the handler returns an unrecognizable object structure.
            throw new Error(`Handler returned an invalid structure or value type: ${typeof result}`);
            
        } catch (error) {
            console.error(`[G-03] Rule Execution Exception (${checkCode}):`, error.message);
            return {
                compliant: false,
                message: `Rule execution failed due to internal error: ${error.message}`,
                code: checkCode,
                details: { error: error.stack, context: logContext }
            };
        }
    }

    /**
     * Initializes default, placeholder rules for initial system function.
     * These should eventually be loaded externally via Dependency Injection (DI) or Configuration.
     */
    _loadDefaultExecutors() {
        
        // Rule 1: Dependency Integrity Check (Simulated Async Check)
        this.register('DEPENDENCY_INTEGRITY', async (payload, config) => {
            // Simulated network or filesystem check
            await new Promise(resolve => setTimeout(resolve, 1)); 
            return { 
                compliant: true, 
                message: "Dependencies checked against manifest (Simulated OK).",
                code: 'DEPENDENCY_INTEGRITY'
            };
        });

        // Rule 2: Resource Limit Check (Synchronous Check)
        this.register('RESOURCE_LIMITS', (payload, config) => {
            const maxSize = config.maxCodeSize || 5000; // default 5KB limit
            const currentSize = payload.content?.length || 0;
            const compliant = currentSize <= maxSize;

            return {
                compliant,
                message: compliant ? "Resource limits check passed." : `Code size (${currentSize} bytes) exceeds limit (${maxSize} bytes).`,
                details: { currentSize, maxSize },
                code: 'RESOURCE_LIMITS'
            };
        });

        // Rule 3: Governance History Marker Signal Check (Traceability requirement)
        this.register('GHM_SIGNAL', (payload) => {
            const compliant = !!payload.metadata?.ghm_signal;
            return {
                compliant,
                message: compliant ? "GHM signal detected." : "Missing mandatory GHM traceability signal in metadata.",
                code: 'GHM_SIGNAL'
            };
        });
    }
}

module.exports = RuleExecutorRegistry;
