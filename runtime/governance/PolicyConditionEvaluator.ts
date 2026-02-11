/**
 * PolicyConditionEvaluator.ts
 * Dedicated utility component responsible for robust and safe parsing and execution
 * of complex governance policy condition expressions (DSL).
 *
 * NOTE: This implementation delegates execution to a sandboxed SecurePolicyEvaluatorTool 
 * dependency provided upon initialization, ensuring security and isolation.
 */

interface SecurePolicyEvaluatorTool {
    execute(args: { conditionExpression: string, context: Record<string, any> }): boolean;
}

interface PolicyConditionEvaluator {
    evaluate(conditionExpression: string, context: Record<string, any>): boolean;
}

export class BasicPolicyConditionEvaluator implements PolicyConditionEvaluator {
    private readonly secureEvaluator: SecurePolicyEvaluatorTool;

    /**
     * Initializes the evaluator with a required sandboxing tool.
     * Dependency Injection is used to provide the sandboxed execution environment.
     * 
     * @param secureEvaluator The SecurePolicyEvaluatorTool instance.
     */
    constructor(secureEvaluator: SecurePolicyEvaluatorTool) {
        if (!secureEvaluator) {
            throw new Error("SecurePolicyEvaluatorTool dependency is required for safe policy evaluation.");
        }
        this.secureEvaluator = secureEvaluator;
    }

    /**
     * Evaluates a complex conditional expression against a context of data points 
     * by delegating the process to the sandboxed SecurePolicyEvaluatorTool.
     *
     * @param conditionExpression The policy rule string.
     * @param context Pre-mapped data.
     */
    public evaluate(conditionExpression: string, context: Record<string, any>): boolean {
        
        try {
            // Delegate the substitution, keyword transformation, and safe execution.
            return this.secureEvaluator.execute({
                conditionExpression: conditionExpression,
                context: context
            });
        } catch (e) {
            console.error(`Error delegating evaluation for condition '${conditionExpression}':`, e);
            return false; // Default fail-safe behavior
        }
    }
}