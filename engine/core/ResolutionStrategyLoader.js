/**
 * ResolutionStrategyLoader
 * 
 * Utility responsible for dynamically loading strategy modules based on the 
 * configuration found in the ConstraintResolutionEngineDefinition schema.
 */
class ResolutionStrategyLoader {
    constructor(definitionConfig) {
        this.strategies = definitionConfig.resolutionStrategies;
        this.strategyCache = new Map();
    }

    /**
     * Retrieves a loaded strategy instance, or loads it if not cached.
     * @param {string} strategyId - The ID defined in the schema (e.g., 'weighted_avg').
     */
    async getStrategy(strategyId) {
        if (!this.strategies[strategyId]) {
            throw new Error(`Strategy ID '${strategyId}' not defined in schema.`);
        }

        if (this.strategyCache.has(strategyId)) {
            return this.strategyCache.get(strategyId);
        }

        const def = this.strategies[strategyId];
        try {
            // Dynamically import the module path defined in the schema
            const StrategyModule = await import(def.implementationPath);
            const StrategyClass = StrategyModule.default || StrategyModule[strategyId];
            
            if (!StrategyClass) {
                 throw new Error(`Module for ${strategyId} did not export strategy class.`);
            }

            const instance = new StrategyClass(def.defaultParameters);
            this.strategyCache.set(strategyId, instance);
            return instance;
            
        } catch (e) {
            console.error(`Failed to load resolution strategy ${strategyId} from ${def.implementationPath}`, e);
            throw new Error(`Initialization failure for strategy ${strategyId}.`);
        }
    }
}

export default ResolutionStrategyLoader;
