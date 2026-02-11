/**
 * src/governance/enforcement/GovernanceMetricProcessor.ts
 * 
 * Defines the core mechanism for evaluating governance metrics against defined enforcement rules.
 * Uses generics for maximum flexibility and type safety across different metric formats.
 */

/**
 * Defines the necessary structure for any data point representing a metric.
 */
export interface GovernanceMetric {
    id: string;
    value: number;
    timestamp: number;
    metadata: Record<string, any>;
}

/**
 * Defines the contract for an enforcement rule capable of checking a metric.
 * TRuleConfig allows for rule-specific configuration details.
 */
export interface EnforcementRule<TMetric extends GovernanceMetric, TRuleConfig = any> {
    readonly ruleId: string;
    readonly enforcementAction: 'WARN' | 'ENFORCE' | 'IGNORE';
    readonly config: TRuleConfig;

    /**
     * Evaluates the metric against the rule criteria.
     * @param metric The metric data point to evaluate.
     * @returns True if the metric violates the rule, false otherwise.
     */
    evaluate(metric: TMetric): boolean;
}

/**
 * The outcome of processing a single metric.
 */
export interface ProcessingResult {
    metricId: string;
    isViolation: boolean;
    violatingRules: Array<{
        ruleId: string;
        action: 'WARN' | 'ENFORCE';
    }>;
    processedTimestamp: number;
}

/**
 * Core class responsible for managing and applying rulesets to incoming governance metrics.
 * @template TMetric - The specific type of metric being processed.
 */
export class GovernanceMetricProcessor<TMetric extends GovernanceMetric> {
    private ruleset: Array<EnforcementRule<TMetric>>;

    /**
     * Initializes the processor with a set of pre-configured rules.
     * @param initialRules - The set of rules used for evaluation.
     */
    constructor(initialRules: Array<EnforcementRule<TMetric>> = []) {
        this.ruleset = initialRules;
        // Note: In a kernel environment, logging should use dedicated kernel logging facilities.
        // console.log(`GovernanceMetricProcessor initialized with ${this.ruleset.length} rules.`);
    }

    /**
     * Dynamically adds or replaces the current ruleset.
     * This method is crucial for hot-swapping governance policy without service restart.
     * @param newRules - The new ruleset to use.
     */
    public setRuleset(newRules: Array<EnforcementRule<TMetric>>): void {
        this.ruleset = newRules;
        // console.info(`Ruleset updated. Total rules: ${this.ruleset.length}`);
    }

    /**
     * Processes a single metric against all active rules.
     * Rule evaluation must be synchronous and idempotent for reliability.
     * @param metric - The metric data point to evaluate.
     * @returns The structured processing result.
     */
    public processMetric(metric: TMetric): ProcessingResult {
        const violatingRules: ProcessingResult['violatingRules'] = [];

        for (const rule of this.ruleset) {
            if (rule.evaluate(metric)) {
                if (rule.enforcementAction !== 'IGNORE') {
                    violatingRules.push({
                        ruleId: rule.ruleId,
                        action: rule.enforcementAction,
                    });
                }
            }
        }

        const isViolation = violatingRules.length > 0;

        // Note: Real enforcement actions (e.g., API calls, state changes) should be delegated 
        // to a separate EnforcementDispatcher based on this result object.

        return {
            metricId: metric.id,
            isViolation,
            violatingRules,
            processedTimestamp: Date.now(),
        };
    }

    /**
     * Processes a collection of metrics efficiently.
     * @param metrics - Array of metrics to process.
     * @returns A promise resolving to an array of processing results (async pattern retained for batch processing reporting).
     */
    public async processBatch(metrics: TMetric[]): Promise<ProcessingResult[]> {
        // Uses standard array mapping since processMetric is synchronously efficient.
        return metrics.map(metric => this.processMetric(metric));
    }
}