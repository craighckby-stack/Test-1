/**
 * @typedef {object} IResolutionStrategy
 * @property {function(object, object): object} resolve - The core method to execute the resolution logic.
 * @property {function(): Promise<void>} [initialize] - Optional asynchronous setup method.
 */

/**
 * @typedef {object} IAsyncCacheGuard
 * @property {function(string, Map<string, any>, Map<string, Promise<any>>, function(string): Promise<any>): Promise<any>} guard - Executes the guarded loading logic using provided maps.
 */

/**
 * ResolutionStrategyLoader
 * 
 * Utility responsible for dynamically loading, validating, and caching resolution strategy modules 
 * defined in the ConstraintResolutionEngine definition schema.
 * Strategies must implement the IResolutionStrategy interface.
 */
class ResolutionStrategyLoader {
    /** @type {object} - The raw strategy definitions loaded from configuration. */
    #strategies;
    /** @type {Map<string, IResolutionStrategy>} - Cache for fully instantiated and initialized strategy objects. */
    #strategyCache;
    /** @type {Map<string, Promise<IResolutionStrategy>>} - Map storing promises for strategies currently being loaded. */
    #loadingPromises;
    /** @type {function(string): Promise<object>} - Dynamic module resolver function. */
    #resolveModule; 
    /** @type {object} - Injected logging utility (must expose 'error'). */
    #logger;
    /** @type {IAsyncCacheGuard} - Plugin for guarded asynchronous loading. */
    #cacheGuard; 

    /**
     * @param {object} definitionConfig - Configuration object containing resolution strategies.
     * @param {object} definitionConfig.resolutionStrategies - Map of strategy IDs to their definitions.
     * @param {object} dependencies - Core dependencies.
     * @param {function(string): Promise<object>} [dependencies.moduleResolver] - Custom module loading function (defaults to standard dynamic `import`).
     * @param {object} [dependencies.logger=console] - Logging utility (e.g., an instance of engine/utilities/Logger).
     * @param {IAsyncCacheGuard} dependencies.asyncCacheGuard - The asynchronous caching and guarding utility.
     */
    constructor(definitionConfig, dependencies = {}) {
        if (!definitionConfig || typeof definitionConfig.resolutionStrategies !== 'object') {
            throw new Error('ResolutionStrategyLoader requires a valid definitionConfig with resolutionStrategies defined.');
        }
        
        const { moduleResolver, logger = console, asyncCacheGuard } = dependencies;

        if (!asyncCacheGuard || typeof asyncCacheGuard.guard !== 'function') {
            throw new Error('ResolutionStrategyLoader requires asyncCacheGuard utility in dependencies.');
        }

        this.#strategies = definitionConfig.resolutionStrategies;
        this.#strategyCache = new Map();
        this.#loadingPromises = new Map();
        
        // Use an injected logger for production resilience and standardized logging.
        this.#logger = logger;
        
        // Inject or default the module loading function for improved testability and flexibility.
        this.#resolveModule = moduleResolver || ((path) => import(path));
        this.#cacheGuard = asyncCacheGuard;
    }

    /**
     * Retrieves a loaded strategy instance, or dynamically loads and caches it.
     * Implements concurrency control via Promise caching.
     * 
     * @param {string} strategyId - The unique ID of the strategy.
     * @returns {Promise<IResolutionStrategy>} The instantiated strategy object.
     * @throws {Error} If the strategy ID is not defined or loading fails.
     */
    async getStrategy(strategyId) {
        // Delegate concurrency control, caching, and promise cleanup to the plugin.
        return this.#cacheGuard.guard(
            strategyId,
            this.#strategyCache, 
            this.#loadingPromises, 
            this._executeLoadingTask.bind(this) // Pass the actual loader logic
        );
    }

    /**
     * Internal method to handle dynamic load, instantiation, validation, and initialization.
     * Handles specific error logging internally.
     * 
     * @param {string} strategyId
     * @returns {Promise<IResolutionStrategy>}
     * @private
     */
    async _executeLoadingTask(strategyId) {
        const def = this.#strategies[strategyId];
        if (!def) {
            throw new Error(`Strategy ID '${strategyId}' not found in the resolution strategies definition.`);
        }
        
        const { implementationPath, defaultParameters = {} } = def;

        if (!implementationPath) {
             throw new Error(`Strategy definition for '${strategyId}' is missing 'implementationPath'.`);
        }

        try {
            // Use the injected resolver
            const StrategyModule = await this.#resolveModule(implementationPath);
            
            // Handle ES Module 'default' export or named export matching the ID.
            const StrategyClass = StrategyModule.default || StrategyModule[strategyId];
            
            if (typeof StrategyClass !== 'function') {
                 throw new Error(`Module loaded from ${implementationPath} did not export a constructable class or constructor.`);
            }

            const instance = new StrategyClass(defaultParameters);
            
            this._validateStrategyInstance(strategyId, instance, implementationPath);
            
            // Optional async initialization hook
            if (typeof instance.initialize === 'function') {
                await instance.initialize();
            }
            
            return instance;
            
        } catch (e) {
            // Log detailed failure using the injected logger for centralized core diagnostics
            this.#logger.error(`Failed loading or initializing strategy '${strategyId}'. Path: ${implementationPath}. Error:`, e);
            
            // Re-throw a standardized public error
            const baseError = e instanceof Error ? e.message : String(e);
            throw new Error(`Strategy initialization failure [${strategyId}]: ${baseError}`);
        }
    }
    
    /**
     * Runtime check to ensure the instance adheres to the IResolutionStrategy interface contract.
     * Enforces the required 'resolve' method.
     * 
     * @param {string} strategyId
     * @param {IResolutionStrategy} instance
     * @param {string} path
     * @private
     */
    _validateStrategyInstance(strategyId, instance, path) {
        if (typeof instance.resolve !== 'function') {
            throw new Error(`Strategy '${strategyId}' instantiated from ${path} does not implement the required 'resolve()' method (IResolutionStrategy contract).`);
        }
    }
}

export default ResolutionStrategyLoader;