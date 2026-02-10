/**
 * AGI-KERNEL Strategic Cost Indexer (SCI)
 * Optimizes cost indexing by applying strategic weights and dynamic runtime factors.
 */
class StrategicCostIndexer {
    /**
     * @param {Object<string, number>} baseCosts - Map of raw cost items (e.g., { resourceA: 100, resourceB: 50 }).
     * @param {Object<string, number>} strategicWeights - Map of strategic importance weights (e.g., { resourceA: 1.5, resourceB: 0.8 }).
     */
    constructor(baseCosts, strategicWeights) {
        if (!baseCosts || !strategicWeights) {
            throw new Error("Base costs and strategic weights are required for initialization.");
        }
        this.baseCosts = baseCosts;
        this.strategicWeights = strategicWeights;
    }

    /**
     * Calculates the Strategic Cost Index by applying strategic weights and runtime factors.
     * @param {Object<string, number>} factors - Dynamic runtime adjustment factors (e.g., utilization, risk).
     * @returns {number} The calculated aggregated strategic cost index.
     */
    calculateIndex(factors = {}) {
        let totalWeightedCost = 0;
        let totalWeight = 0;

        for (const [key, cost] of Object.entries(this.baseCosts)) {
            // Default weight is 1.0 if not explicitly defined strategically
            const weight = this.strategicWeights[key] || 1.0;
            // Default factor is 1.0 if no dynamic adjustment is applied
            const factor = factors[key] || 1.0;

            // Cost = (Base Cost * Strategic Weight * Runtime Factor)
            const adjustedCost = cost * weight * factor;
            
            totalWeightedCost += adjustedCost;
            totalWeight += weight; 
        }

        // Prevent division by zero
        if (totalWeight === 0) return 0;
        
        // Returns the average strategic index relative to the total weighted importance
        return totalWeightedCost / totalWeight;
    }

    /**
     * Placeholder for recursive abstraction, designed for hierarchical cost analysis.
     * In a full implementation, this would recursively index sub-components.
     */
    recursiveAbstraction() {
        return { 
            status: "Abstraction complete",
            details: "Hierarchical cost indexing path defined."
        };
    }
}

export default StrategicCostIndexer;