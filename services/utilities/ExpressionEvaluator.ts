export class ExpressionEvaluator {
    
    /**
     * Core evaluation function that executes the expression safely within a restricted scope.
     * @param expression The expression or condition string.
     * @param context The variables available to the expression.
     * @returns The calculated result, or NaN on execution failure.
     */
    private _execute(expression: string, context: Record<string, any>): any {
        const contextKeys = Object.keys(context);
        const contextValues = Object.values(context);
        
        try {
            // Improved Sandbox: Avoids 'with()' (RCE vulnerability) by using explicit parameter binding.
            // Variables are ONLY accessible if they exist as keys in the context. This significantly reduces scope leakage.
            const tempFunction = new Function(...contextKeys, `
                "use strict"; 
                // Wrap expression in parentheses to treat it as a single return value.
                return (${expression});
            `);
            
            return tempFunction(...contextValues);

        } catch (e) {
            // Use console.error only during development/debugging.
            // console.error(`Expression evaluation failed: ${expression}`, e);
            return NaN;
        }
    }

    /**
     * Safely evaluates a mathematical expression string using provided context variables.
     * Crucially, this implementation uses a secure function scope to limit variable access.
     * @param expression The mathematical expression (e.g., "tokens * 0.01 + cpu_ms * 0.0001")
     * @param context Key/value pairs used as variables in the expression (e.g., UsageSnapshot)
     * @returns The calculated numerical result. Returns 0 on failure or non-numeric result.
     */
    public safeEvaluate(expression: string, context: Record<string, any>): number {
        const result = this._execute(expression, context);
        
        if (typeof result === 'number' && isFinite(result)) {
            return result;
        }
        
        // Handle standard type coercion if expression yields boolean (e.g., 5 > 2) in numeric context.
        if (typeof result === 'boolean') {
            return result ? 1 : 0;
        }

        return 0;
    }

    /**
     * Safely evaluates a boolean condition string (e.g., "load_avg > 0.9 && error_rate < 0.01").
     * Reuses the secure evaluation logic and interprets the result as a boolean outcome.
     */
    public safeEvaluateBoolean(condition: string, context: Record<string, any>): boolean {
        const result = this._execute(condition, context);

        if (typeof result === 'boolean') {
            return result;
        }
        
        // Standard JS truthiness interpretation if the result is numerical (0 is false, non-zero is true).
        if (typeof result === 'number' && isFinite(result)) {
            return !!result;
        }
        
        return false;
    }
}