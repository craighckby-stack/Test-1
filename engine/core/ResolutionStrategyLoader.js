/**
 * ResolutionStrategyLoader
 * 
 * Utility responsible for dynamically loading and caching resolution strategy modules 
 * defined in the ConstraintResolutionEngine definition schema.
 * 
 * Strategies must implement the IResolutionStrategy interface.
 */
class ResolutionStrategyLoader {
    /** @type {object} */
    #strategies;
    /** @type {Map<string, object>} */
    #strategyCache;

    /**
     * @param {object} definitionConfig - Configuration object containing resolution strategies.
     * @param {object} definitionConfig.resolutionStrategies - Map of strategy IDs to their definitions.
     */
    constructor(definitionConfig) {
        if (!definitionConfig || typeof definitionConfig.resolutionStrategies !== 'object') {
            throw new Error('ResolutionStrategyLoader requires a valid definitionConfig with resolutionStrategies.');
        }
        
        this.#strategies = definitionConfig.resolutionStrategies;
        this.#strategyCache = new Map();
    }

    /**
     * Retrieves a loaded strategy instance, or dynamically loads and caches it.
     * 
     * @param {string} strategyId - The unique ID of the strategy (e.g., 'weighted_avg').
     * @returns {Promise<object>} The instantiated strategy object (must implement IResolutionStrategy).
     * @throws {Error} If the strategy ID is not defined or loading fails.
     */
    async getStrategy(strategyId) {
        if (this.#strategyCache.has(strategyId)) {
            return this.#strategyCache.get(strategyId);
        }

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

            // Instantiate and cache
            const instance = new StrategyClass(defaultParameters);
            
            // Optional: Call initialize() if the interface requires async setup
            if (typeof instance.initialize === 'function') {
                await instance.initialize();
            }

            this.#strategyCache.set(strategyId, instance);
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