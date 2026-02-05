/**
 * RESOURCE CHECK REGISTRY (RCR)
 * ID: RCR-G01
 * GSEP Role: Centralized store and execution manager for standardized resource checks.
 *
 * The RCR provides a formal interface for defining new environmental prerequisites,
 * decoupling the specifics of resource measurement (like memory usage or latency)
 * from the main Resource Attestation Module (RAM) governance flow.
 */

class ResourceCheckRegistry {
    constructor() {
        this.checks = new Map();
    }

    /**
     * Registers a new check function under a unique identifier.
     * @param {string} id - Unique identifier for the check (e.g., 'CORE_CPU_BASELINE').
     * @param {function(environmentMonitor, config, payloadMetadata): Promise<{success: boolean, details: object}>} checkFn 
     *        The function defining the resource verification logic.
     */
    registerCheck(id, checkFn) {
        if (this.checks.has(id)) {
            console.warn(`RCR Warning: Check ID ${id} already registered. Overwriting.`);
        }
        this.checks.set(id, checkFn);
    }

    /**
     * Retrieves a specific check function.
     * @param {string} id - The check identifier.
     * @returns {function | undefined}
     */
    getCheck(id) {
        return this.checks.get(id);
    }

    /**
     * Executes all registered checks concurrently, providing necessary context.
     * This method is intended to be called by ResourceAttestationModule.
     * @param {object} environmentMonitor - The monitoring dependency.
     * @param {object} config - Baseline governance configuration.
     * @param {object} payloadMetadata - Requirements specific to the mutation payload.
     * @returns {Array<Promise<object>>} An array of promises, each representing a standardized check execution.
     */
    runAllChecks(environmentMonitor, config, payloadMetadata) {
        const checkPromises = [];
        const requiredResources = payloadMetadata.requiredResources || {};

        for (const [id, checkFn] of this.checks.entries()) {
            // The runner function ensures standardization of results and error handling.
            const runner = async () => {
                try {
                    const result = await checkFn(environmentMonitor, config, requiredResources);
                    return { 
                        check: id, 
                        status: result.success ? 'PASS' : 'FAIL', 
                        details: result.details || {},
                        success: result.success
                    };
                } catch (error) {
                    return {
                        check: id,
                        status: 'ERROR',
                        details: { message: `Critical RCR execution error: ${error.message}`, stack: error.stack },
                        success: false
                    };
                }
            };
            checkPromises.push(runner());
        }
        
        return Promise.all(checkPromises);
    }
}

module.exports = ResourceCheckRegistry;