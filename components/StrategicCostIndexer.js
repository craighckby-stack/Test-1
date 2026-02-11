/**
 * AGI-KERNEL Strategic Cost Indexer (SCI)
 * Optimizes cost indexing by applying strategic weights and dynamic runtime factors.
 */
class StrategicCostIndexer {

    /**
     * Utility method for efficient map multiplication (Base Cost * Strategic Weight).
     * This logic is extracted and optimized for high-volume operations.
     * @param {Object<string, number>} baseCosts 
     * @param {Object<string, number>} weights 
     * @returns {Object<string, number>} Map of strategically weighted costs.
     */
    static _applyStrategicWeights(baseCosts, weights) {
        const weightedCosts = {};
        const keys = Object.keys(baseCosts);
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const base = baseCosts[key];
            const weight = weights[key] || 1.0; 
            
            // Fast path multiplication and type check
            if (typeof base === 'number' && typeof weight === 'number') {
                weightedCosts[key] = base * weight;
            } else {
                // Defensive assignment if types are invalid, assuming base is the fallback
                weightedCosts[key] = base;
            }
        }
        return weightedCosts;
    }

    /**
     * @param {Object<string, number>} baseCosts - Map of raw cost items.
     * @param {Object<string, number>} strategicWeights - Map of strategic importance weights.
     */
    constructor(baseCosts, strategicWeights) {
        if (!baseCosts || typeof baseCosts !== 'object' || !strategicWeights || typeof strategicWeights !== 'object') {
            throw new Error("Base costs and strategic weights must be valid objects for initialization.");
        }
        this.baseCosts = baseCosts;
        this.strategicWeights = strategicWeights;
    }

    /**
     * Calculates the Strategic Cost Index.
     * Shifts the strategic weighting logic internal to the class for improved modularity 
     * before delegating final factor aggregation.
     * 
     * @param {Object<string, number>} factors - Dynamic runtime adjustment factors.
     * @returns {number} The calculated aggregated strategic cost index.
     */
    calculateIndex(factors = {}) {
        // 1. Calculate strategically weighted costs internally (performance improvement)
        const strategicallyWeightedCosts = StrategicCostIndexer._applyStrategicWeights(
            this.baseCosts, 
            this.strategicWeights
        );

        // 2. Delegate final factor application and aggregation. 
        // Note: External tool signature is updated to reflect pre-weighted input.
        return KERNEL_SYNERGY_CAPABILITIES.CostIndexingTool.execute(
            'calculateFactorAggregation',
            strategicallyWeightedCosts,
            factors
        );
    }
}

export default StrategicCostIndexer;