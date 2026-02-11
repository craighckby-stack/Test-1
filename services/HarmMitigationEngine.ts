/**
 * AGI-KERNEL Policy: HARM Mitigation Engine v1.1
 */

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

export class HarmMitigationEngine {

    private policyConfig: HarmPolicyConfig;
    private initialized: boolean = false;

    // Severity Map constant for consistent comparison
    private static readonly SEVERITY_MAP: { [key: string]: number } = {
        'P0_CRITICAL': 3,
        'P1_HIGH': 2,
        'P2_MODERATE': 1,
        'P3_LOW': 0
    };

    constructor(policyConfigPath: string = 'config/HARM.json') {
        try {
            // Note: Synchronous config loading is used as per original requirement
            this.policyConfig = require(policyConfigPath);
            
            // Basic validation to ensure required fields exist
            if (!this.policyConfig.rules || !Array.isArray(this.policyConfig.rules)) {
                 throw new Error("Policy configuration is missing the 'rules' array.");
            }

            this.initialized = true;
        } catch (error) {
            console.error("HARM Mitigation Engine failed to load configuration:", error);
            // Fail-safe
            this.policyConfig = { default_action: "BLOCK", rules: [], contextual_exemptions: [] };
        }
    }

    /**
     * Analyzes input based on scores and executes mandated policy actions.
     * @param detectionScores Object mapping category to detected harm score (0.0 to 1.0).
     * @returns The enforced action and the chosen mitigation strategy.
     */
    public async enforcePolicy(detectionScores: DetectionScores, contextTags: string[] = []): Promise<PolicyResult> {
        if (!this.initialized) {
            console.warn("HARM Engine uninitialized. Returning default action.");
            return { enforcedAction: this.policyConfig.default_action, mitigation: 'LOG' };
        }

        const highestRiskRule = this.findHighestRiskViolation(detectionScores);

        if (highestRiskRule) {
            // Check for contextual exemptions
            const isExempt = this.checkExemptions(highestRiskRule, contextTags);

            if (isExempt) {
                // Log the potential violation but apply default/no action
                console.log(`HARM policy bypassed for context: ${highestRiskRule.category} score ${highestRiskRule.score}`);
                return { enforcedAction: 'PASS_WITH_LOG', mitigation: highestRiskRule.rule.mitigation_strategy };
            } 

            return {
                enforcedAction: highestRiskRule.rule.action,
                mitigation: highestRiskRule.rule.mitigation_strategy
            };
        }

        return { enforcedAction: 'PASS', mitigation: 'NONE' };
    }

    /**
     * Finds the single highest risk rule violation based on detection scores and thresholds.
     */
    private findHighestRiskViolation(detectionScores: DetectionScores): { rule: PolicyRule, score: number } | null {
        let highestRisk: { rule: PolicyRule, score: number } | null = null;

        for (const rule of this.policyConfig.rules) {
            const score = detectionScores[rule.category] || 0.0;
            
            const isHighestScore = highestRisk ? score > highestRisk.score : true;

            if (score >= rule.threshold && isHighestScore) {
                highestRisk = { rule: rule, score: score };
            }
        }

        return highestRisk;
    }

    /**
     * Checks if the detected violation is overridden by any context tag exemption.
     */
    private checkExemptions(violation: { rule: PolicyRule, score: number }, contextTags: string[]): boolean {
        if (contextTags.length === 0 || this.policyConfig.contextual_exemptions.length === 0) {
            return false;
        }

        return contextTags.some(tag => 
            this.policyConfig.contextual_exemptions
                .filter(ex => ex.context_tag === tag)
                .some(ex => this.isSeverityExempt(violation.rule.severity, ex.max_severity_override))
        );
    }

    /**
     * Determines if a specific rule severity exceeds the allowed maximum override severity.
     * If rule severity > maxOverride, it means the rule is NOT exempt (too severe).
     * If rule severity <= maxOverride, it IS exempt.
     */
    private isSeverityExempt(ruleSeverity: string, maxOverride: string): boolean {
        const ruleLevel = HarmMitigationEngine.SEVERITY_MAP[ruleSeverity] ?? -1;
        const overrideLevel = HarmMitigationEngine.SEVERITY_MAP[maxOverride] ?? -1;
        
        // The exemption applies if the rule's severity level is LESS THAN OR EQUAL TO the override level.
        // If the rule severity is P1 (2) and maxOverride is P2 (1), the rule is too severe to be bypassed (2 > 1).
        // If the rule severity is P2 (1) and maxOverride is P1 (2), the rule IS bypassed (1 <= 2).
        return ruleLevel <= overrideLevel;
    }
}