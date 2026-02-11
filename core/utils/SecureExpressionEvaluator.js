import { SecureMathEvaluator } from '../plugins/SecureMathEvaluator.js';

/**
 * Sovereign AGI - Secure Expression Evaluator
 * Safely parses and executes mathematical and logical formulas provided by CRCM or other configuration sources.
 * This utility delegates execution to a strictly sandboxed Math Evaluator plugin to prevent arbitrary code execution.
 * It operates as a stateless, static utility wrapper for secure formula processing.
 */
class SecureExpressionEvaluator {
    
    // Regex to find variables formatted as Context.VariableName, ensuring strict character validation.
    static CONTEXT_VAR_REGEX = /Context\.([A-Za-z0-9_]+)/g;

    /**
     * Executes a formula securely against a provided context map.
     * @param {string} formula - The mathematical/logical expression (e.g., 'Context.TCS * 1.5 + MAX(10, Context.Urgency)')
     * @param {Object<string, number>} context - Key-value map of runtime variables (TCS, Urgency, etc.).
     * @returns {number} The evaluated numeric result, or 0 on failure/invalid input.
     */
    static evaluate(formula, context) {
        // Input validation
        if (typeof formula !== 'string' || formula.trim() === '') {
            return 0;
        }

        const executionContext = context || {};

        try {
            // Step 1: Replace Context variables (e.g., Context.TCS -> 50)
            const executableFormula = formula.replace(
                SecureExpressionEvaluator.CONTEXT_VAR_REGEX, 
                (match, varName) => {
                    const value = executionContext[varName];
                    
                    // Robust safety check: Ensure substituted value is a finite number.
                    // If missing, null, or invalid (NaN, Infinity), substitute 0.
                    if (typeof value === 'number' && isFinite(value)) {
                        return value;
                    }
                    
                    return 0;
                }
            );

            // Step 2: Delegate secure execution to the sandboxed plugin
            return SecureMathEvaluator.execute(executableFormula);

        } catch (e) {
            // Use a specific prefix for high-integrity governance logging
            console.error(`AGI Kernel SECURE_EVAL_FAIL: Formula "${formula.substring(0, 80).trim()}..." failed execution. Error: ${e.message}`);
            return 0;
        }
    }
}

export { SecureExpressionEvaluator };