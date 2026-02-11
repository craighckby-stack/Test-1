import { IRiskThresholdChecker, ComplianceResult } from '../../plugins/Compliance/RiskThresholdChecker';

/**
 * Manages specialized risk floor compliance checks using an abstracted evaluation mechanism.
 * The specific risk thresholds are defined internally or loaded via configuration.
 */
export class RiskFloorComplianceUtility {
    private checker: IRiskThresholdChecker;

    /**
     * @param checker The generalized risk threshold evaluation service.
     */
    constructor(checker: IRiskThresholdChecker) {
        this.checker = checker;
    }

    /**
     * Checks a set of critical operational metrics against predefined minimum thresholds (Risk Floors).
     * Logic abstracted to the IRiskThresholdChecker plugin.
     *
     * @param currentOperationalMetrics Key/value pairs of current measured metrics.
     * @returns The result of the compliance check.
     */
    public checkCoreOperationalRisk(currentOperationalMetrics: Record<string, number>): ComplianceResult {
        // Configuration abstracted away from the core checking logic
        const CORE_RISK_FLOORS = {
            minimumTrustScore: 0.85,
            latencyMetric: 0.90, // Must be >= 0.90 (e.g., probability of fast response)
            securityRating: 75
        };

        return this.checker.evaluate(currentOperationalMetrics, CORE_RISK_FLOORS);
    }

    // Other utility methods related to enforcement now leverage the checker or are simplified.
}
