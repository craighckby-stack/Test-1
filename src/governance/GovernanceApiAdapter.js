/**
 * GovernanceApiAdapterToolKernel.js
 * Abstraction layer for fetching dynamic governance configuration overlays.
 * This isolates network complexity (handling fetch, timeouts, error codes) 
 * from upstream kernels' core logic (state management and merging).
 */

// Note: Dependencies must be formalized and injected, consistent with strategic mandates.

class GovernanceApiAdapterToolKernel {
    /**
     * @param {string} endpoint - The configuration API URL.
     * @param {SecureResourceLoaderInterfaceKernel} secureLoader - Tool for secure resource fetching (e.g., handling network I/O, integrity checks).
     * @param {ILoggerToolKernel} logger - Standard strategic logging dependency.
     */
    constructor(endpoint, secureLoader, logger) {
        this.endpoint = endpoint;
        this.secureLoader = secureLoader;
        this.logger = logger;
        
        this.#setupDependencies();
    }

    /**
     * Ensures all required dependencies are present and valid, strictly enforcing synchronous setup isolation.
     * @private
     */
    #setupDependencies() {
        if (!this.endpoint || typeof this.endpoint !== 'string') {
             throw new Error("GovernanceApiAdapterToolKernel requires a valid configuration endpoint (string).");
        }
        // Validate strategic dependencies
        if (!this.secureLoader || typeof this.secureLoader.loadJson !== 'function') {
             throw new Error("GovernanceApiAdapterToolKernel requires a valid SecureResourceLoaderInterfaceKernel (must implement loadJson).");
        }
        if (!this.logger || typeof this.logger.info !== 'function') {
             throw new Error("GovernanceApiAdapterToolKernel requires a valid ILoggerToolKernel.");
        }
    }

    /**
     * Fetches the latest dynamic governance configuration overlay from the external endpoint.
     * @returns {Promise<object>} The configuration object.
     */
    async fetchLatestConfig() {
        this.logger.info(`[GovernanceApiAdapterToolKernel] Attempting to fetch constants from: ${this.endpoint}`);
        
        try {
            // Utilize the injected SecureResourceLoaderInterfaceKernel for fetching and parsing JSON.
            // Default timeout set to 5000ms, passed via strategic options object.
            const fetchOptions = { timeout: 5000 }; 
            const config = await this.secureLoader.loadJson(this.endpoint, fetchOptions);
            
            return config;
            
        } catch (e) {
            this.logger.error(`[GovernanceApiAdapterToolKernel] Fetch failed for ${this.endpoint}: ${e.message}`, { error: e });
            // Re-throw a contextualized, standardized error for upstream management
            throw new Error(`GOVERNANCE_ADAPTER_FETCH_FAILURE: Failed to retrieve configuration from ${this.endpoint}: ${e.message}`);
        }
    }
}

module.exports = GovernanceApiAdapterToolKernel;