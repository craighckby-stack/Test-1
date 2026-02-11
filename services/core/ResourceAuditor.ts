import { RCMConfig, UsageSnapshot, CostReport } from '../types/EfficiencyTypes';

// Define the interface that the secure expression evaluator satisfies.
interface EvaluatorPlugin {
    safeEvaluate(expression: string, context: Record<string, any>): number;
    safeEvaluateBoolean(expression: string, context: Record<string, any>): boolean;
}

// Re-declare AggregateUsage type based on the external meter's output structure
type AggregateUsage = UsageSnapshot & { 
    last_updated: number; 
    [key: string]: number | undefined; 
};

// Define the interface for the extracted Usage Meter logic
interface UsageMeterPlugin {
    recordUsage(moduleId: string, usage: Partial<UsageSnapshot>): void;
    getAggregatedUsage(moduleId: string): AggregateUsage | undefined;
    getAllModules(): string[];
}

/**
 * ResourceAuditor: The core utility for cost calculation and RCM policy enforcement.
 * It now relies on external plugins for secure expression evaluation and usage metering.
 */
export class ResourceAuditor {
    private config: RCMConfig;
    private evaluator: EvaluatorPlugin;
    private meter: UsageMeterPlugin;

    constructor(initialConfig: RCMConfig, meterPlugin: UsageMeterPlugin) {
        this.config = initialConfig;
        this.meter = meterPlugin;
        
        // Placeholder initialization for the external plugin instance (Evaluator).
        this.evaluator = {
            safeEvaluate: (expr, ctx) => { console.warn("Using mock evaluator for plugin!"); return 0.0; },
            safeEvaluateBoolean: (expr, ctx) => { console.warn("Using mock evaluator for plugin!"); return false; }
        } as EvaluatorPlugin;

        console.log(`Resource Auditor initialized with RCM v${initialConfig.version}.`);
    }

    /** Updates the RCM configuration dynamically. */
    public updateConfig(newConfig: RCMConfig): void {
        this.config = newConfig;
    }

    /** 
     * Delegates usage recording to the external metering plugin.
     */
    public recordUsage(moduleId: string, usage: Partial<UsageSnapshot>): void {
        this.meter.recordUsage(moduleId, usage);
    }

    /** 
     * Calculates operational cost based on current usage, leveraging the secure expression evaluator.
     */
    public calculateCost(moduleId: string, currentUsage: UsageSnapshot): CostReport {
        const moduleConfig = this.config.modules[moduleId];
        const model = moduleConfig?.cost_model;
        
        if (!model) {
            return {
                total_cost: 0.0,
                module: moduleId,
                calculation_reason: "No cost model defined for module."
            };
        }

        // Use the secure evaluator plugin
        const cost = this.evaluator.safeEvaluate(model, currentUsage);

        return {
            total_cost: parseFloat(cost.toFixed(6)), 
            module: moduleId,
            calculation_reason: `Evaluated model: ${model}`
        };
    }

    /** Checks all adaptive policies against current system state and applies actions. */
    public checkAdaptivePolicies(): string[] {
        const actions: string[] = [];
        
        const systemContext = { 
            global_load: 0.85, // Example metric
            high_cost_modules_count: this.meter.getAllModules().length // Fetched from meter plugin
        };

        for (const policy of this.config.adaptive_policies || []) {
            if (this.evaluator.safeEvaluateBoolean(policy.trigger_condition, systemContext)) {
                console.log(`[RCM Policy Enforcement] Triggered: ${policy.name}. Action: ${policy.action_name}`);
                actions.push(policy.action_name);
                // Dispatch policy enforcement signal (external system call)
            }
        }

        return actions; 
    }

    /** Retrieves the current aggregated usage snapshot from the metering plugin. */
    public getAggregatedUsage(moduleId: string): AggregateUsage | undefined {
        return this.meter.getAggregatedUsage(moduleId);
    }
}