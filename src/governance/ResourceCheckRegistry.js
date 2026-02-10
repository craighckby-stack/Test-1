/**
 * RESOURCE CHECK REGISTRY (RCR)
 * ID: RCR-G01
 * GSEP Role: Centralized store and execution manager for standardized resource checks.
 *
 * The RCR provides a formal interface for defining new environmental prerequisites,
 * decoupling the specifics of resource measurement (like memory usage or latency)
 * from the main Resource Attestation Module (RAM) governance flow.
 */

// --- JSDoc Definitions ---

/**
 * @typedef {Object} CheckResult
 * @property {boolean} success - True if the check passed (i.e., resources are sufficient).
 * @property {Object} [details] - Measurement data or information about the threshold violation.
 */

/**
 * @typedef {Object} CheckExecutionResult
 * @property {string} check - The ID of the check run.
 * @property {string} status - The execution status (PASS, FAIL, ERROR).
 * @property {boolean} success - Final boolean indicator (false if FAIL or ERROR).
 * @property {Object} details - Measurement details, error message, or stack trace.
 */

/**
 * @callback ResourceCheckFunction
 * @param {Object} monitor - The system monitoring dependency (e.g., EnvironmentMonitor).
 * @param {Object} governanceConfig - Global governance configuration baselines (e.g., standard thresholds).
 * @param {Object} payloadMetadata - Requirements specific to the current mutation or operation payload.
 * @returns {Promise<CheckResult>}
 */

const CHECK_STATUS = Object.freeze({
    PASS: 'PASS',
    FAIL: 'FAIL',
    ERROR: 'ERROR', // Indicates an internal execution failure of the check function itself.
});

/**
 * Manages and executes resource prerequisite checks.
 */
class ResourceCheckRegistry {
    constructor() {
        /** @type {Map<string, ResourceCheckFunction>} */
        this.checks = new Map();
        this.STATUS = CHECK_STATUS;
        
        // RCR-I01: The execution wrapper is now formalized as AsyncCheckExecutionWrapper.
        // Rely on kernel injection. If missing, use a failure stub.
        this.asyncExecutionWrapper = (typeof globalThis !== 'undefined' && globalThis.AGI_KERNEL_UTILITIES?.AsyncCheckExecutionWrapper) 
                                     || this._noOpRunner();
    }

    /**
     * @private Fallback for missing dependency. Forces kernel environment setup compliance.
     */
    _noOpRunner() {
        console.error("RCR-E02: Required dependency AsyncCheckExecutionWrapper not found. Execution will fail.");
        return {
            execute: async (fn, id, args, STATUS) => {
                return { 
                    check: id, 
                    status: STATUS.ERROR,
                    success: false,
                    details: { message: `RCR Fatal: Cannot execute check ${id}. AsyncCheckExecutionWrapper dependency missing.` }
                };
            }
        };
    }

    /**
     * Registers a new check function under a unique identifier.
     * Throws an error if the function is invalid. Logs a warning if overwriting.
     * @param {string} id - Unique identifier for the check (e.g., 'CORE_CPU_BASELINE').
     * @param {ResourceCheckFunction} checkFn - The function defining the resource verification logic.
     */
    registerCheck(id, checkFn) {
        if (typeof checkFn !== 'function') {
            throw new TypeError(`RCR-E01: Check function for ID ${id} must be a function.`);
        }
        if (this.checks.has(id)) {
            console.warn(`RCR-W01: Check ID ${id} already registered. Overwriting definition.`);
        }
        this.checks.set(id, checkFn);
    }

    /**
     * Retrieves a specific check function.
     * @param {string} id - The check identifier.
     * @returns {ResourceCheckFunction | undefined}
     */
    getCheck(id) {
        return this.checks.get(id);
    }

    /**
     * Executes all registered checks concurrently, providing necessary context.
     * The complexity of standardized error handling and result formatting is delegated
     * to the injected executionWrapper (AsyncCheckExecutionWrapper).
     * 
     * @param {Object} monitor - System monitoring dependency.
     * @param {Object} governanceConfig - Baseline configuration.
     * @param {Object} payloadMetadata - Mutation-specific requirements.
     * @returns {Promise<CheckExecutionResult[]>} A promise resolving to an array of standardized check results.
     */
    runAllChecks(monitor, governanceConfig, payloadMetadata) {
        const checkPromises = [];
        const args = [monitor, governanceConfig, payloadMetadata];

        for (const [id, checkFn] of this.checks.entries()) {
            
            // Delegation of execution, error handling, and result standardization to the specialized wrapper plugin
            const runnerPromise = this.asyncExecutionWrapper.execute(
                checkFn, 
                id, 
                args,
                this.STATUS
            );
            checkPromises.push(runnerPromise);
        }
        
        // Execute all checks concurrently and wait for all results
        return Promise.all(checkPromises);
    }
}

module.exports = ResourceCheckRegistry;