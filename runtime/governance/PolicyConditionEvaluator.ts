/**
 * PolicyConditionEvaluator.ts
 * Dedicated utility component responsible for robust and safe parsing and execution
 * of complex governance policy condition expressions (DSL).
 *
 * NOTE: The highly unsafe direct execution via eval/new Function has been replaced 
 * by delegation to the SecurePolicyEvaluatorTool plugin for safety and sandboxing.
 */

interface SecurePolicyEvaluatorTool {
    execute(args: { conditionExpression: string, context: Record<string, any> }): boolean;
}

interface PolicyConditionEvaluator {
    evaluate(conditionExpression: string, context: Record<string, any>): boolean;
}

// Placeholder for runtime plugin access (assuming injection or centralized registry lookup)
declare const PluginRegistry: {
    getTool: (name: "SecurePolicyEvaluatorTool") => SecurePolicyEvaluatorTool | undefined
};

let SECURE_EVALUATOR: SecurePolicyEvaluatorTool | undefined;

// Attempt to retrieve the secure tool once upon file load/initialization
if (typeof PluginRegistry !== 'undefined') {
    // @ts-ignore
    SECURE_EVALUATOR = PluginRegistry.getTool("SecurePolicyEvaluatorTool");
}

export class BasicPolicyConditionEvaluator implements PolicyConditionEvaluator {

    /**
     * Evaluates a complex conditional expression against a context of data points 
     * by delegating the process to the sandboxed SecurePolicyEvaluatorTool.
     *
     * @param conditionExpression The policy rule string.
     * @param context Pre-mapped data.
     */
    public evaluate(conditionExpression: string, context: Record<string, any>): boolean {
        
        if (!SECURE_EVALUATOR) {
            console.error("SecurePolicyEvaluatorTool is not available. Policy evaluation aborted.");
            return false;
        }

        try {
            // Delegate the substitution, keyword transformation, and safe execution.
            return SECURE_EVALUATOR.execute({
                conditionExpression: conditionExpression,
                context: context
            });
        } catch (e) {
            console.error(`Error delegating evaluation for condition '${conditionExpression}':`, e);
            return false; // Default fail-safe behavior
        }
    }
}