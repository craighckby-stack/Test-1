/**
 * Interface for granular performance or resource usage metrics.
 */
interface GovernanceMetric {
    id: string;
    value: number;
    baseCost: number;
    // Contextual tag for recursive abstraction purposes
    category: string; 
}

/**
 * Interface for cost constraints and penalty factors.
 */
interface CostRule {
    metricId: string;
    limit: number;
    penaltyFactor: number;
}

// Maps for O(1) lookup (Optimization Goal 3)
type RulesMap = Map<string, CostRule>;
type MetricsMap = Map<string, GovernanceMetric>;

// Helper type for the external plugin interface
declare const FunctionMemoizerUtility: {
    memoize: <T extends (...args: any[]) => any>(fn: T, serializer?: (args: any[]) => string) => T;
};

/**
 * NOTE: MetricCostCalculator is sourced from the AGI-KERNEL plugin layer.
 * It abstracts the core logic for calculating costs based on rules and limits.
 */
declare class MetricCostCalculator {
    public static calculate(
        metric: GovernanceMetric, 
        rule: CostRule | undefined, 
        observedValue: number
    ): number;
}

/**
 * The Cost Rule Engine, optimized for computational efficiency and recursive abstraction.
 * Applies memoization, hash lookups, and functional iteration patterns.
 */
class CostRuleEngine {
    private rulesMap: RulesMap;
    private metricsMap: MetricsMap;
    // Goal 1: Memoization applied to the core calculation function.
    private calculateMetricCostMemoized: (metricId: string, value: number) => number;

    /**
     * Initializes the engine, transforming input arrays into hash maps for O(1) access
     * and setting up memoized cost calculation functions.
     * @param rules Array of rules.
     * @param metrics Array of metrics.
     */
    constructor(rules: CostRule[], metrics: GovernanceMetric[]) {
        // Goal 3: Utilize efficient data structures (Hash Maps/Maps) for O(1) lookups
        this.rulesMap = new Map(rules.map(r => [r.metricId, r]));
        this.metricsMap = new Map(metrics.map(m => [m.id, m]));
        
        // Goal 1 & 2: Implement Memoization and Recursive Abstraction setup
        // Memoize the core calculation function based on metricId and value.
        this.calculateMetricCostMemoized = FunctionMemoizerUtility.memoize(
            this.calculateMetricCostAbstraction.bind(this),
            // Custom simple serializer for key generation (metricId:value)
            (args: [string, number]) => `${args[0]}:${args[1]}` 
        );
    }

    /**
     * Core cost calculation logic (Recursive Abstraction - Step 1/2).
     * This function performs O(1) lookups and delegates the pure calculation
     * to the MetricCostCalculator plugin, making it cleaner and more focused.
     * @param metricId The ID of the metric being evaluated.
     * @param value The current value of the metric.
     * @returns The calculated cost.
     */
    private calculateMetricCostAbstraction(metricId: string, value: number): number {
        const metric = this.metricsMap.get(metricId); // O(1) lookup

        if (!metric) {
            return 0;
        }

        const rule = this.rulesMap.get(metricId); // O(1) lookup

        // Delegate pure calculation logic to the abstracted plugin
        return MetricCostCalculator.calculate(metric, rule, value);
    }

    /**
     * Calculates the total governance cost by aggregating the costs of all metrics.
     * Goal 4 & 5: Minimize iterations using functional methods (reduce).
     * @returns The total aggregated cost.
     */
    public calculateTotalGovernanceCost(): number {
        // Use functional iteration (reduce) instead of traditional loops.
        return Array.from(this.metricsMap.values()).reduce((totalCost, metric) => {
            // Use the memoized function for efficiency
            const metricCost = this.calculateMetricCostMemoized(metric.id, metric.value);
            return totalCost + metricCost;
        }, 0);
    }
    
    /**
     * Calculates costs grouped by category (Example of further recursive aggregation).
     * @returns A map of category ID to total cost.
     */
    public calculateCategorizedCosts(): Map<string, number> {
        const categoryCosts = new Map<string, number>();

        for (const metric of this.metricsMap.values()) {
            const cost = this.calculateMetricCostMemoized(metric.id, metric.value);
            const currentTotal = categoryCosts.get(metric.category) || 0;
            categoryCosts.set(metric.category, currentTotal + cost);
        }

        return categoryCosts;
    }
}