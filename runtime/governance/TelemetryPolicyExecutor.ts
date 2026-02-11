/**
 * TelemetryPolicyExecutor.ts
 * Executes conditional governance responses based on vetted telemetry results.
 * Implements logic to map validation results against the Tiered Criticality Mapping
 * defined in the TelemetryVettingSpec.
 *
 * Sovereign AGI v94.1 Intelligence Refactor: Externalized reusable PolicyRuleMatcher
 * utility to enforce SoC and improve governance code reuse.
 */

// --- Telemetry Domain Interfaces ---
interface VettingResult {
    domain: string;
    violations: string[];
    isCritical: boolean;
    isMajor: boolean;
}

interface RejectionPolicy {
    condition: string;
    action: string;
}

interface GovernancePolicies {
    rejection_policies: RejectionPolicy[];
    default_fallback_protocol?: string;
}

interface TelemetryVettingSpec {
    governance_responses: GovernancePolicies;
    // Define other relevant sections here
}

// --- Dependency Injection Interface ---
/**
 * Required utility for safely evaluating complex policy DSLs.
 * Implemented by runtime/governance/PolicyConditionEvaluator.ts
 */
interface PolicyConditionEvaluator {
    evaluate(conditionExpression: string, context: Record<string, any>): boolean;
}

// Assumed access to the global PolicyRuleMatcherTool defined in the plugin layer.
declare const PolicyRuleMatcherTool: { 
    execute(args: any): string; 
}; 

export class TelemetryPolicyExecutor {
    private policies: GovernancePolicies;
    private evaluator: PolicyConditionEvaluator;

    /**
     * @param spec The full TelemetryVettingSpec.
     * @param evaluator The required utility for policy condition evaluation.
     */
    constructor(spec: TelemetryVettingSpec, evaluator: PolicyConditionEvaluator) {
        if (!spec || !spec.governance_responses) {
            throw new Error("TelemetryPolicyExecutor: Invalid TelemetryVettingSpec provided.");
        }
        this.policies = spec.governance_responses;
        this.evaluator = evaluator;
    }

    public evaluate(results: VettingResult[]): string {
        // 1. Prepare a structured context from results
        const context = this.createEvaluationContext(results);

        // 2. Delegate policy matching to the external PolicyRuleMatcher tool.
        // We pass the PolicyConditionEvaluator's bound method as the required evaluator callback.
        const evaluatorCallback = (condition: string, ctx: Record<string, any>): boolean => {
            return this.evaluator.evaluate(condition, ctx);
        };

        return PolicyRuleMatcherTool.execute({
            policies: this.policies.rejection_policies,
            context: context,
            evaluator: evaluatorCallback,
            defaultAction: this.policies.default_fallback_protocol || 'DEFAULT_PASS'
        });
    }

    /**
     * Transforms VettingResults into a predictable key/value context 
     * suitable for the expression evaluator.
     * @param results The incoming vetting results.
     */
    private createEvaluationContext(results: VettingResult[]): Record<string, any> {
        const context: Record<string, any> = {};

        // Direct function equivalents (e.g., used to evaluate 'IsCriticalFailure(A1)')
        results.forEach(r => {
            context[`IsCriticalFailure(${r.domain})`] = r.isCritical;
            context[`IsMajorFailure(${r.domain})`] = r.isMajor;
        });

        // Aggregate variables for global checks (e.g., used to evaluate 'TotalCriticalFailures > 2')
        context['TotalCriticalFailures'] = results.filter(r => r.isCritical).length;
        context['AnyCriticalFailure'] = results.some(r => r.isCritical);

        return context;
    }
}