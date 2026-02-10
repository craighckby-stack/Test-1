/**
 * Configuration constants for the Efficiency Debt Prioritizer (EDP).
 * These values dictate the strategic trade-off between impact gain and complexity/risk acceptance.
 *
 * NOTE: This configuration adheres to the MetricWeightConfigurationValidator schema,
 * ensuring weights are normalized and thresholds are within [0, 1].
 */

interface DebtPrioritizationConfig {
    // EDP Scoring Weights (W) - Must sum to 1.0
    IMPACT_WEIGHT: number;
    COMPLEXITY_PENALTY: number;

    // EDP Safety Thresholds (M-02 Pre-Processor) - Must be in [0.0, 1.0]
    RISK_THRESHOLD: number;
    MIN_PRIORITY_TO_INJECT: number;
}

const DEBT_PRIORITIZATION_CONFIG: DebtPrioritizationConfig = {
    // EDP Scoring Weights (W)
    IMPACT_WEIGHT: 0.70,        // High weight on potential performance improvements/savings.
    COMPLEXITY_PENALTY: 0.30,   // Low penalty, favoring refactors that require moderate effort if impact is high.

    // EDP Safety Thresholds (M-02 Pre-Processor)
    RISK_THRESHOLD: 0.12,       // Maximum normalized risk (0.0 to 1.0) allowed for automated execution. Items exceeding this require manual review.
    MIN_PRIORITY_TO_INJECT: 0.05 // Minimum calculated score required for a proposal to be forwarded to GSEP.
};

module.exports = DEBT_PRIORITIZATION_CONFIG;
