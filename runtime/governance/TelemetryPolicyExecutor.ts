/**
 * TelemetryPolicyExecutorKernel.ts
 * Executes conditional governance responses based on vetted telemetry results.
 * Implements logic to map validation results against the Tiered Criticality Mapping
 * defined in the TelemetryVettingSpec.
 *
 * Refactored to adhere to AGI-KERNEL standards: synchronous setup extraction, state
 * privatization, and rigorous I/O proxy creation.
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
    execute(args: {
        policies: RejectionPolicy[],
        context: Record<string, any>,
        evaluator: (condition: string, ctx: Record<string, any>) => boolean,
        defaultAction: string 
    }): string; 
}; 

export class TelemetryPolicyExecutorKernel {
    #policies: GovernancePolicies;
    #evaluator: PolicyConditionEvaluator;

    /**
     * @param spec The full TelemetryVettingSpec.
     * @param evaluator The required utility for policy condition evaluation.
     */
    constructor(spec: TelemetryVettingSpec, evaluator: PolicyConditionEvaluator) {
        this.#setupDependencies(spec, evaluator);
    }

    /**
     * Isolated control flow proxy for throwing setup errors.
     */
    #throwSetupError(message: string): never {
        throw new Error(`TelemetryPolicyExecutorKernel Setup Error: ${message}`);
    }

    /**
     * Synchronously validates and assigns all required internal dependencies and configuration.
     */
    #setupDependencies(spec: TelemetryVettingSpec, evaluator: PolicyConditionEvaluator): void {
        if (!spec || typeof spec !== 'object' || !spec.governance_responses) {
            this.#throwSetupError("Invalid TelemetryVettingSpec provided. Missing spec or governance_responses.");
        }
        if (!evaluator || typeof evaluator.evaluate !== 'function') {
            this.#throwSetupError("Invalid PolicyConditionEvaluator provided (missing or invalid 'evaluate' function).");
        }

        this.#policies = spec.governance_responses;
        this.#evaluator = evaluator;
    }

    /**
     * Internal Logic Proxy: Transforms VettingResults into a predictable key/value context 
     * suitable for the expression evaluator.
     */
    #createEvaluationContext(results: VettingResult[]): Record<string, any> {
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
    
    /**
     * I/O Proxy: Delegates condition evaluation using the injected evaluator tool.
     */
    #delegateToEvaluator(condition: string, ctx: Record<string, any>): boolean {
        return this.#evaluator.evaluate(condition, ctx);
    }

    /**
     * I/O Proxy: Delegates policy matching and execution lookup to the external PolicyRuleMatcherTool.
     */
    #delegateToPolicyMatcher(context: Record<string, any>): string {
        const policies = this.#policies.rejection_policies;
        const defaultAction = this.#policies.default_fallback_protocol || 'DEFAULT_PASS';

        // Create an encapsulated callback that uses the internal I/O proxy for evaluation
        const evaluatorCallback = (condition: string, ctx: Record<string, any>): boolean => {
            return this.#delegateToEvaluator(condition, ctx);
        };

        // Execution of the external tool
        return PolicyRuleMatcherTool.execute({
            policies: policies,
            context: context,
            evaluator: evaluatorCallback,
            defaultAction: defaultAction
        });
    }

    /**
     * Public API: Evaluates vetting results against governance policies to determine the appropriate response action.
     * @param results The incoming vetting results.
     * @returns The determined governance action string.
     */
    public evaluate(results: VettingResult[]): string {
        // 1. Prepare a structured context from results
        const context = this.#createEvaluationContext(results);
        
        // 2. Delegate policy matching to the external tool
        return this.#delegateToPolicyMatcher(context);
    }
}