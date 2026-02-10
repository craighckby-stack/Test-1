/**
 * M-02 Mutation Pre-Processor (MPP)
 *
 * Role: Implements GSEP Stage 2 efficiency gate. M-02 runs necessary, low-latency invariant checks
 * and fast-path compliance simulations against a proposed mutation payload before submission to
 * the P-01 Trust Calculus (Stage 3). It utilizes the RuleExecutorRegistry to delegate specific
 * compliance checks, ensuring high extensibility (OCP).
 */
class MutationPreProcessor {
    /**
     * @param {object} governanceConfig - Global governance configuration.
     * @param {RuleExecutorRegistry} ruleRegistry - Centralized registry for all executable checks.
     * @param {object} [tools] - A map of registered tools/plugins (injected by Kernel).
     */
    constructor(governanceConfig, ruleRegistry, tools = {}) {
        if (!governanceConfig || !governanceConfig.rules) {
             throw new Error("MPP requires a valid governance configuration including compliance rules.");
        }
        if (!ruleRegistry || typeof ruleRegistry.execute !== 'function') {
             throw new Error("MPP requires a valid RuleExecutorRegistry instance.");
        }

        this.config = governanceConfig;
        this.checkDefinitions = governanceConfig.rules;
        this.ruleRegistry = ruleRegistry;
        this.tools = tools;
        
        // Define key thresholds
        this.PASS_THRESHOLD = governanceConfig.thresholds?.pass || 0.7;

        if (!this.tools.PenaltyScoreCalculator || typeof this.tools.PenaltyScoreCalculator.execute !== 'function') {
            console.warn("MPP: PenaltyScoreCalculator plugin not available. Scoring logic will fail if called.");
            // Note: Robust environments may throw or use a fallback implementation here.
        }
    }

    /**
     * Executes technical compliance checks and invariant enforcement.
     * @param {object} mutationPayload - The proposed code mutation payload.
     * @param {object} [context={}] - Optional context (e.g., current system state/metrics).
     * @returns {Promise<{ R_INDEX: number, violations: Array<{ code: string, message: string, penalty: number }>, pass: boolean }>}
     */
    async preProcess(mutationPayload, context = {}) {
        const checkResults = [];

        // 1. Execute all checks
        for (const checkCode in this.checkDefinitions) {
            const ruleDefinition = this.checkDefinitions[checkCode];
            
            const checkResult = this._executeCheck(checkCode, ruleDefinition, mutationPayload, context);
            checkResults.push(checkResult);
        }

        // 2. Score the results using the extracted utility (PenaltyScoreCalculator)
        const scorer = this.tools.PenaltyScoreCalculator;
        
        if (!scorer) {
             // Critical failure simulation if the tool wasn't injected correctly
             return { R_INDEX: 0.0, violations: [{ code: "SYS_ERR", message: "Scoring engine missing.", penalty: 1.0 }], pass: false };
        }

        const { R_INDEX, violations } = scorer.execute(checkResults);

        return {
            R_INDEX: R_INDEX,
            violations: violations,
            pass: R_INDEX >= this.PASS_THRESHOLD
        };
    }

    /**
     * Delegates the execution of a specific governance check to the RuleExecutorRegistry.
     * @param {string} checkCode - The key for the check definition.
     * @param {object} ruleDefinition - The rule configuration from governanceConfig.rules.
     * @param {object} payload - The mutation payload.
     * @param {object} context - System context.
     * @returns {{ compliant: boolean, code: string, message: string, weight: number }}
     */
    _executeCheck(checkCode, ruleDefinition, payload, context) {
        const defaultViolation = {
            compliant: false,
            code: checkCode,
            message: ruleDefinition.failureMessage || `Unspecified technical failure during check ${checkCode}.`,
            weight: ruleDefinition.penaltyWeight || 0.1
        };

        try {
            // Retrieve check-specific configuration (e.g., limits, targets) from invariants.
            const checkConfig = this.config.invariants?.[checkCode] || {};
            
            // Delegate the logic execution. The registry handles the actual implementation based on checkCode.
            const checkPassed = this.ruleRegistry.execute(checkCode, payload, checkConfig, context);

            // Output format compliant with PenaltyScoreCalculator input requirements
            return {
                compliant: checkPassed,
                code: checkCode,
                // Use the configured failure message only if the check fails
                message: checkPassed ? "OK" : ruleDefinition.failureMessage,
                weight: ruleDefinition.penaltyWeight || 0
            };
            
        } catch (e) {
            // Technical failure during execution (e.g., missing rule handler, configuration syntax error)
            console.error(`MPP: Fatal execution error for rule ${checkCode}:`, e);
            // Treat execution errors as critical violations
            defaultViolation.message = `Critical Execution Failure (${e.name}): ${e.message}`;
            // Ensure high penalty for critical execution failures
            defaultViolation.weight = 1.0; 
            return defaultViolation;
        }
    }
}

module.exports = MutationPreProcessor;