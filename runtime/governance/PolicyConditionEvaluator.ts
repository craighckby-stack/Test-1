/**
 * PolicyConditionEvaluatorKernel.ts
 * Dedicated utility component responsible for robust and safe parsing and execution
 * of complex governance policy condition expressions (DSL).
 *
 * This implementation delegates execution to a sandboxed SecurePolicyEvaluatorTool
 * dependency provided upon initialization, ensuring security and isolation.
 */

interface SecurePolicyEvaluatorTool {
    execute(args: { conditionExpression: string, context: Record<string, any> }): boolean;
}

interface PolicyConditionEvaluator {
    evaluate(conditionExpression: string, context: Record<string, any>): boolean;
}

export class PolicyConditionEvaluatorKernel implements PolicyConditionEvaluator {
    private readonly secureEvaluator: SecurePolicyEvaluatorTool;

    /**
     * Helper proxy function for throwing setup errors.
     */
    private #throwSetupError(message: string): never {
        throw new Error(`[PolicyConditionEvaluatorKernel] Setup Error: ${message}`);
    }

    /**
     * Rigorously extracts synchronous dependency validation and assignment.
     * Satisfies synchronous setup extraction goal.
     */
    private #setupDependencies(secureEvaluator: SecurePolicyEvaluatorTool): void {
        if (!secureEvaluator) {
            this.#throwSetupError("SecurePolicyEvaluatorTool dependency is required for safe policy evaluation.");
        }
        this.secureEvaluator = secureEvaluator;
    }

    /**
     * Initializes the evaluator with a required sandboxing tool.
     */
    constructor(secureEvaluator: SecurePolicyEvaluatorTool) {
        this.#setupDependencies(secureEvaluator);
    }

    /**
     * I/O Proxy function for error logging.
     * Satisfies I/O proxy creation goal.
     */
    private #logEvaluationError(conditionExpression: string, error: unknown): void {
        console.error(`Error delegating evaluation for condition '${conditionExpression}':`, error);
    }

    /**
     * Delegation proxy function for external tool execution.
     * Satisfies I/O proxy creation goal.
     */
    private #delegateToSecureEvaluator(conditionExpression: string, context: Record<string, any>): boolean {
        return this.secureEvaluator.execute({
            conditionExpression: conditionExpression,
            context: context
        });
    }

    /**
     * Evaluates a complex conditional expression against a context of data points
     * by delegating the process to the sandboxed SecurePolicyEvaluatorTool.
     */
    public evaluate(conditionExpression: string, context: Record<string, any>): boolean {

        try {
            // Delegate the substitution, keyword transformation, and safe execution.
            return this.#delegateToSecureEvaluator(conditionExpression, context);
        } catch (e) {
            this.#logEvaluationError(conditionExpression, e);
            return false; // Default fail-safe behavior
        }
    }
}
