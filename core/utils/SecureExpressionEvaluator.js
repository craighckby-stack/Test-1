import { SecureMathEvaluator } from '../plugins/SecureMathEvaluator.js';

/**
 * Sovereign AGI - Secure Expression Evaluator
 * Safely parses and executes mathematical and logical formulas provided by CRCM or other configuration sources.
 * This utility delegates execution to a strictly sandboxed Math Evaluator plugin to prevent arbitrary code execution.
 */
class SecureExpressionEvaluator {
    constructor() {
        // Configuration now managed by the SecureMathEvaluator plugin.
    }

    /**
     * Executes a formula securely against a provided context map.
     * @param {string} formula - The mathematical/logical expression (e.g., 'Context.TCS * 1.5 + MAX(10, Context.Urgency)')
     * @param {Object} context - Key-value map of runtime variables (Context.TCS, Context.Urgency, etc.)
     * @returns {number} The evaluated numeric result.
     */
    evaluate(formula, context) {
        try {
            // Step 1: Replace Context variables (e.g., Context.TCS -> 50)
            let executableFormula = formula.replace(/Context\.([^\s\)]+)/g, (match, p1) => {
                const value = context[p1];
                // Ensure substituted value is a safe number, defaults to 0 if missing or invalid.
                return (typeof value === 'number' && !isNaN(value)) ? value : 0;
            });

            // Step 2: Delegate secure execution to the sandboxed plugin
            return SecureMathEvaluator.execute(executableFormula);

        } catch (e) {
            console.error(`Secure Expression Evaluation failed for formula "${formula}": ${e.message}`);
            return 0;
        }
    }
}

export { SecureExpressionEvaluator };