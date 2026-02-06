/**
 * ResolutionStrategyLoader
 * 
 * Utility responsible for dynamically loading, validating, and caching resolution strategy modules 
 * defined in the ConstraintResolutionEngine definition schema.
 * 
 * Strategies must implement the IResolutionStrategy interface.
 */
class ResolutionStrategyLoader {
    /** @type {object} - The raw strategy definitions loaded from configuration. */
    #strategies;
    /** @type {Map<string, object>} - Cache for fully instantiated and initialized strategy objects. */
    #strategyCache;
    /** @type {Map<string, Promise<object>>} - Map storing promises for strategies currently being loaded, preventing race conditions. */
    #loadingPromises;

    /**
     * @param {object} definitionConfig - Configuration object containing resolution strategies.
     * @param {object} definitionConfig.resolutionStrategies - Map of strategy IDs to their definitions.
     */
    constructor(definitionConfig) {
        if (!definitionConfig || typeof definitionConfig.resolutionStrategies !== 'object') {
            throw new Error('ResolutionStrategyLoader requires a valid definitionConfig with resolutionStrategies defined.');
        }
        
        this.#strategies = definitionConfig.resolutionStrategies;
        this.#strategyCache = new Map();
        this.#loadingPromises = new Map();
    }

    /**
     * Retrieves a loaded strategy instance, or dynamically loads and caches it.
     * 
     * Implements concurrency control to ensure strategy modules are imported and instantiated only once,
     * even if requested simultaneously.
     * 
     * @param {string} strategyId - The unique ID of the strategy (e.g., 'weighted_avg').
     * @returns {Promise<object>} The instantiated strategy object (must implement IResolutionStrategy).
     * @throws {Error} If the strategy ID is not defined or loading fails.
     */
    async getStrategy(strategyId) {
        // 1. Check cache (fast path)
        if (this.#strategyCache.has(strategyId)) {
            return this.#strategyCache.get(strategyId);
        }

        // 2. Check ongoing loading promises (concurrency protection)
        if (this.#loadingPromises.has(strategyId)) {
            return this.#loadingPromises.get(strategyId);
        }

        // 3. Define the actual loading task
        const loadingTask = this._loadAndInstantiateStrategy(strategyId);

        // 4. Store the promise before awaiting
        this.#loadingPromises.set(strategyId, loadingTask);

        try {
            const strategyInstance = await loadingTask;
            
            // 5. Cache strategy instance on success
            this.#strategyCache.set(strategyId, strategyInstance);
            return strategyInstance;
        } catch (e) {
            // The error will be thrown naturally after cleanup
            throw e;
        } finally {
            // 6. Ensure the loading promise is removed regardless of success or failure
            this.#loadingPromises.delete(strategyId);
        }
    }

    /**
     * Internal method to handle dynamic import, instantiation, and validation.
     * @private
     */
    async _loadAndInstantiateStrategy(strategyId) {
        const def = this.#strategies[strategyId];
        if (!def) {
            throw new Error(`Strategy ID '${strategyId}' not found in the resolution strategies definition.`);
        }
        
        if (!def.implementationPath) {
             throw new Error(`Strategy definition for '${strategyId}' is missing 'implementationPath'.`);
        }

        const { implementationPath, defaultParameters = {} } = def;

        try {
            // Dynamically import the module path.
            const StrategyModule = await import(implementationPath);
            
            // Handle ES Module 'default' export or named export matching the ID.
            const StrategyClass = StrategyModule.default || StrategyModule[strategyId];
            
            if (typeof StrategyClass !== 'function') {
                 throw new Error(`Module loaded from ${implementationPath} did not export a strategy class or constructor.`);
            }

            // Instantiate the class
            const instance = new StrategyClass(defaultParameters);
            
            // Runtime validation check against IResolutionStrategy (requires a 'resolve' method)
            if (typeof instance.resolve !== 'function') {
                throw new Error(`Instantiated strategy '${strategyId}' does not implement the required 'resolve()' method (IResolutionStrategy interface).`);
            }

            // Optional: Call initialize() if the interface requires async setup
            if (typeof instance.initialize === 'function') {
                await instance.initialize();
            }
            
            return instance;
            
        } catch (e) {
            // Enhance the error message for clarity on failure point
            const baseError = e instanceof Error ? e.message : String(e);
            console.error(`[StrategyLoader] Failed loading strategy '${strategyId}' from ${implementationPath}.`, e);
            throw new Error(`Initialization failure for strategy ${strategyId}. Source: ${implementationPath}. Reason: ${baseError}`);
        }
    }
}

export default ResolutionStrategyLoader;
