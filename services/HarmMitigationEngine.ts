/**
 * AGI-KERNEL Policy: HARM Mitigation Kernel v1.2
 * Enforces policy based on detected harm scores, utilizing rigorous architectural separation.
 */

// --- External Interfaces ---
interface PolicyRule {
    category: string;
    threshold: number;
    severity: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MODERATE' | 'P3_LOW';
    action: string;
    mitigation_strategy: string;
}

interface ContextualExemption {
    context_tag: string;
    max_severity_override: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MODERATE' | 'P3_LOW';
}

interface HarmPolicyConfig {
    default_action: string;
    rules: PolicyRule[];
    contextual_exemptions: ContextualExemption[];
}

type DetectionScores = { [category: string]: number };

interface PolicyResult {
    enforcedAction: string;
    mitigation: string;
}

export class HarmMitigationKernel {

    // Rigorously privatized state and constants
    private #policyConfig: HarmPolicyConfig;
    private #isInitialized: boolean = false;

    // Privatized constant for severity mapping
    private readonly #SEVERITY_MAP: { [key: string]: number } = {
        'P0_CRITICAL': 3,
        'P1_HIGH': 2,
        'P2_MODERATE': 1,
        'P3_LOW': 0
    };

    constructor(policyConfigPath: string = 'config/HARM.json') {
        this.#setupDependencies(policyConfigPath);
    }

    /**
     * 1. Synchronous Setup Extraction: Handles configuration loading and initial validation.
     */
    private #setupDependencies(policyConfigPath: string): void {
        try {
            this.#policyConfig = this.#loadAndValidateConfig(policyConfigPath);
            this.#isInitialized = true;
        } catch (error) {
            // Use I/O Proxy for logging setup errors
            this.#throwSetupError(error);
            // Fail-safe initialization
            this.#policyConfig = { default_action: "BLOCK", rules: [], contextual_exemptions: [] };
        }
    }

    /**
     * I/O Proxy: Handles synchronous configuration file loading and schema checks.
     */
    private #loadAndValidateConfig(policyConfigPath: string): HarmPolicyConfig {
        let config: HarmPolicyConfig;

        // Direct synchronous I/O isolation (require)
        try {
            // Note: Synchronous config loading is used as per original requirement
            config = require(policyConfigPath);
        } catch (e) {
            throw new Error(`Failed to synchronously load configuration from ${policyConfigPath}. ${e instanceof Error ? e.message : String(e)}`);
        }

        // Basic validation
        if (!config.rules || !Array.isArray(config.rules)) {
            throw new Error("Policy configuration is missing the 'rules' array.");
        }
        return config;
    }

    /**
     * I/O Proxy: Handles logging setup errors.
     */
    private #throwSetupError(error: any): void {
        console.error("HARM Mitigation Kernel failed to load configuration:", error instanceof Error ? error.message : String(error));
    }

    /**
     * Analyzes input based on scores and executes mandated policy actions.
     * @param detectionScores Object mapping category to detected harm score (0.0 to 1.0).
     * @returns The enforced action and the chosen mitigation strategy.
     */
    public async enforcePolicy(detectionScores: DetectionScores, contextTags: string[] = []): Promise<PolicyResult> {
        if (!this.#isInitialized) {
            this.#logWarning("HARM Kernel uninitialized. Returning default action.");
            return { enforcedAction: this.#policyConfig.default_action, mitigation: 'LOG' };
        }

        const highestRiskViolation = this.#delegateToRiskAssessment(detectionScores);

        if (highestRiskViolation) {
            const isExempt = this.#delegateToCheckExemptions(highestRiskViolation, contextTags);

            if (isExempt) {
                this.#logPolicyBypass(highestRiskViolation.rule.category, highestRiskViolation.score);
                return { enforcedAction: 'PASS_WITH_LOG', mitigation: highestRiskViolation.rule.mitigation_strategy };
            }

            return {
                enforcedAction: highestRiskViolation.rule.action,
                mitigation: highestRiskViolation.rule.mitigation_strategy
            };
        }

        return { enforcedAction: 'PASS', mitigation: 'NONE' };
    }

    // --- I/O Proxy Methods for Internal Logic Delegation ---

    /**
     * I/O Proxy: Proxies console.warn.
     */
    private #logWarning(message: string): void {
        console.warn(message);
    }

    /**
     * I/O Proxy: Logs when a policy is bypassed.
     */
    private #logPolicyBypass(category: string, score: number): void {
        console.log(`HARM policy bypassed for context: ${category} score ${score}`);
    }

    /**
     * I/O Proxy Delegation: Finds the single highest risk violation.
     */
    private #delegateToRiskAssessment(detectionScores: DetectionScores): { rule: PolicyRule, score: number } | null {
        return this.#findHighestRiskViolation(detectionScores);
    }

    /**
     * I/O Proxy Delegation: Checks if the detected violation is overridden.
     */
    private #delegateToCheckExemptions(violation: { rule: PolicyRule, score: number }, contextTags: string[]): boolean {
        return this.#checkExemptions(violation, contextTags);
    }

    /**
     * I/O Proxy (Logic Flow): Finds the single highest risk rule violation based on detection scores and thresholds.
     */
    private #findHighestRiskViolation(detectionScores: DetectionScores): { rule: PolicyRule, score: number } | null {
        let highestRisk: { rule: PolicyRule, score: number } | null = null;

        for (const rule of this.#policyConfig.rules) {
            const score = detectionScores[rule.category] || 0.0;

            const isHighestScore = highestRisk ? score > highestRisk.score : true;

            if (score >= rule.threshold && isHighestScore) {
                highestRisk = { rule: rule, score: score };
            }
        }

        return highestRisk;
    }

    /**
     * I/O Proxy (Logic Flow): Checks if the detected violation is overridden by any context tag exemption.
     */
    private #checkExemptions(violation: { rule: PolicyRule, score: number }, contextTags: string[]): boolean {
        if (contextTags.length === 0 || this.#policyConfig.contextual_exemptions.length === 0) {
            return false;
        }

        return contextTags.some(tag =>
            this.#policyConfig.contextual_exemptions
                .filter(ex => ex.context_tag === tag)
                .some(ex => this.#determineIfExempt(violation.rule.severity, ex.max_severity_override))
        );
    }

    /**
     * I/O Proxy (Logic Flow): Determines if a specific rule severity exceeds the allowed maximum override severity.
     */
    private #determineIfExempt(ruleSeverity: string, maxOverride: string): boolean {
        const ruleLevel = this.#calculateSeverityLevel(ruleSeverity);
        const overrideLevel = this.#calculateSeverityLevel(maxOverride);

        // The exemption applies if the rule's severity level is LESS THAN OR EQUAL TO the override level.
        return ruleLevel <= overrideLevel;
    }

    /**
     * Internal Helper Proxy: Converts severity string to numerical level using the private map.
     */
    private #calculateSeverityLevel(severity: string): number {
        return this.#SEVERITY_MAP[severity] ?? -1;
    }
}
