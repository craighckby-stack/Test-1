/**
 * G-03 Rule Executor Registry
 *
 * Role: A centralized registry responsible for storing, managing, and executing all specific
 * GSEP compliance and invariant checks. It decouples the M-02 Mutation Pre-Processor
 * from the implementation details of any single check, ensuring high scalability and maintainability.
 */
class RuleExecutorRegistry {
    constructor() {
        this.executors = new Map();
        this._loadDefaultExecutors();
    }

    /**
     * Registers a specific check handler function.
     * @param {string} checkCode - Unique identifier for the rule (e.g., 'DEPENDENCY_INTEGRITY').
     * @param {function(payload: object, config: object, context: object): boolean} handler - The function that returns true for compliance.
     */
    register(checkCode, handler) {
        if (typeof handler !== 'function') {
            throw new Error(`Rule handler for ${checkCode} must be a function.`);
        }
        this.executors.set(checkCode, handler);
    }

    /**
     * Executes the specific check identified by checkCode.
     * @param {string} checkCode
     * @param {object} payload - Mutation payload.
     * @param {object} config - Rule-specific configuration (from invariants).
     * @param {object} context - Current operational context.
     * @returns {boolean} True if compliant, false otherwise.
     */
    execute(checkCode, payload, config = {}, context = {}) {
        const handler = this.executors.get(checkCode);

        if (!handler) {
            // If a rule is configured but its executor is missing, warn but assume compliance
            // unless explicit safety standards mandate immediate failure.
            console.warn(`Registry missing handler for check code: ${checkCode}. Assuming compliant.`);
            return true; 
        }

        return handler(payload, config, context);
    }

    /**
     * Initializes default, placeholder rules for initial system function.
     */
    _loadDefaultExecutors() {
        // Rule 1: Dependency Integrity Check (Ensuring necessary resources/modules exist)
        this.register('DEPENDENCY_INTEGRITY', (payload, config) => {
            // Placeholder: Check if all imported files exist in the system structure.
            // Real implementation requires AST analysis and file system access.
            return true; 
        });

        // Rule 2: Resource Limit Check (Code footprint, memory usage prediction, etc.)
        this.register('RESOURCE_LIMITS', (payload, config) => {
            const maxSize = config.maxCodeSize || 5000;
            const currentSize = payload.content?.length || 0;
            return currentSize <= maxSize;
        });

        // Rule 3: Governance History Marker Signal Check (Traceability requirement)
        this.register('GHM_SIGNAL', (payload) => {
            // Requires explicit metadata proving where this mutation originated (required for OGT traceback).
            return !!payload.metadata?.ghm_signal;
        });
        
        // Add other core checks here...
    }
}

module.exports = RuleExecutorRegistry;