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
 * @property {boolean} success - True if the check passed.
 * @property {Object} [details] - Optional details regarding the measurement or threshold violation.
 */

/**
 * @callback ResourceCheckFunction
 * @param {Object} monitor - The system monitoring dependency (e.g., EnvironmentMonitor).
 * @param {Object} governanceConfig - Global governance configuration baselines.
 * @param {Object} metadata - Requirements specific to the current mutation or operation payload (includes requiredResources).
 * @returns {Promise<CheckResult>}
 */

const CHECK_STATUS = {
    PASS: 'PASS',
    FAIL: 'FAIL',
    ERROR: 'ERROR', // Indicates an internal execution failure of the check function itself.
};

class ResourceCheckRegistry {
    constructor() {
        /** @type {Map<string, ResourceCheckFunction>} */
        this.checks = new Map();
        this.STATUS = CHECK_STATUS;
    }

    /**
     * Registers a new check function under a unique identifier.
     * @param {string} id - Unique identifier for the check (e.g., 'CORE_CPU_BASELINE').
     * @param {ResourceCheckFunction} checkFn - The function defining the resource verification logic.
     */
    registerCheck(id, checkFn) {
        if (typeof checkFn !== 'function') {
            throw new TypeError(`RCR Error: Check function for ID ${id} must be a function.`);
        }
        if (this.checks.has(id)) {
            console.warn(`RCR Warning: Check ID ${id} already registered. Overwriting.`);
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
     * This method is intended to be called by ResourceAttestationModule.
     *
     * @param {Object} monitor - The monitoring dependency providing current system metrics.
     * @param {Object} governanceConfig - Baseline governance configuration.
     * @param {Object} metadata - Requirements specific to the mutation payload.
     * @returns {Promise<Array<{check: string, status: string, success: boolean, details: Object}>>}
     *          A promise resolving to an array of standardized check results.
     */
    runAllChecks(monitor, governanceConfig, metadata) {
        const checkPromises = [];

        for (const [id, checkFn] of this.checks.entries()) {
            // The runner function ensures standardization of results and robust error handling.
            const runner = async () => {
                try {
                    // Pass the full context (monitor, governanceConfig, metadata) to the check function.
                    const result = await checkFn(monitor, governanceConfig, metadata);
                    
                    return { 
                        check: id, 
                        status: result.success ? this.STATUS.PASS : this.STATUS.FAIL, 
                        details: result.details || {},
                        success: result.success
                    };
                } catch (error) {
                    // Handle critical errors during check execution (e.g., monitor unavailable)
                    return {
                        check: id,
                        status: this.STATUS.ERROR,
                        details: { 
                            message: `Critical RCR execution error in ${id}: ${error.message}`, 
                            stack: error.stack 
                        },
                        success: false
                    };
                }
            };
            checkPromises.push(runner());
        }
        
        // Execute all checks concurrently and wait for all results
        return Promise.all(checkPromises);
    }
}

module.exports = ResourceCheckRegistry;