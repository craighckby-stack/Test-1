const path = require('path');

/**
 * Manages the loading, caching, and retrieval of system governance configurations.
 * Implements memoization (promise caching) for maximum computational efficiency on repeated access.
 * This loader relies on an injected I/O utility for abstraction of file system access.
 */
class GovernanceLoader {
    /**
     * @param {object} ioPlugin Instance of the I/O utility plugin (must expose loadJson method).
     * @param {string} [configDirectory='config/governance'] The base directory where governance files reside (relative to IO plugin's root).
     */
    constructor(ioPlugin, configDirectory = 'config/governance') {
        if (!ioPlugin || typeof ioPlugin.loadJson !== 'function') {
             throw new Error("GovernanceLoader requires a valid IO utility plugin instance with a 'loadJson' method.");
        }
        
        this.io = ioPlugin;
        // Ensure configDirectory is stored correctly for path joining
        this.configDirectory = configDirectory;
        /** @type {Map<string, Promise<Object>>} Cache storage for pending or resolved configuration loading promises. */
        this.cache = new Map();
        
        // NOTE: Removed logic modifying the IO plugin's global base path. 
        // Path construction is now handled internally in the load method.
    }

    /**
     * Loads a specific governance policy configuration by name.
     * Caches the promise of the loading operation (promise memoization).
     * 
     * @param {string} policyName The name of the policy (e.g., 'security', 'resource_limits').
     * @returns {Promise<Object>} The parsed configuration object.
     */
    async load(policyName) {
        const cacheKey = policyName.toLowerCase();

        // 1. Check cache for existing promise or resolved value
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const fileName = `${cacheKey}.json`;
        // Construct the full path relative to the IO plugin's root
        const fullPath = path.join(this.configDirectory, fileName);

        // 2. Define the loading operation
        const loadOperation = this.io.loadJson(fullPath)
            .catch(error => {
                // Remove failed promise from cache to allow retries
                this.cache.delete(cacheKey);
                throw error;
            });
        
        // 3. Cache the promise immediately to prevent concurrent duplicate I/O operations (race conditions)
        this.cache.set(cacheKey, loadOperation);

        // 4. Await and return the result
        return loadOperation;
    }

    /**
     * Utility method for accessing deeply nested configurations safely using dot notation.
     * @param {string} policyName The policy configuration to load.
     * @param {string} pathString Dot-separated path (e.g., 'limits.cpu').
     * @returns {Promise<any>} The value at the specified path, or undefined.
     */
    async get(policyName, pathString) {
        const config = await this.load(policyName);
        
        if (!pathString) return config;
        
        return pathString.split('.').reduce((acc, part) => {
            if (acc === undefined || acc === null) return undefined; 
            return acc[part];
        }, config);
    }

    /**
     * Clears all cached configuration promises, forcing a full reload on next access.
     */
    clearCache() {
        this.cache.clear();
    }
}

module.exports = GovernanceLoader;