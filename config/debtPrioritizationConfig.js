/**
 * Configuration constants for the Efficiency Debt Prioritizer (EDP).
 * These values dictate the strategic trade-off between impact gain and complexity/risk acceptance.
 *
 * NOTE: This configuration adheres to the MetricWeightConfigurationValidator schema,
 * ensuring weights are normalized and thresholds are within [0, 1].
 */

/**
 * Synchronously constructs the base configuration object.
 * This helper isolates data definition (preparation) from the module's export routine, 
 * aligning with architectural principles of separating synchronous data preparation from core module export/execution.
 */
const _definePrioritizationConfig = () => ({
    // --- EDP Scoring Weights (W) - Must sum to 1.0 ---

    /** High weight on potential performance improvements/savings. */
    IMPACT_WEIGHT: 0.70,

    /** Penalty for complexity, favoring refactors that require moderate effort if impact is high. */
    COMPLEXITY_PENALTY: 0.30,

    // --- EDP Safety Thresholds (M-02 Pre-Processor) - Must be in [0.0, 1.0] ---

    /** 
     * Maximum normalized risk (0.0 to 1.0) allowed for automated execution. 
     * Items exceeding this require manual review. 
     */
    RISK_THRESHOLD: 0.12,

    /** 
     * Minimum calculated score required for a proposal to be forwarded to the Global Strategic Execution Pipeline (GSEP). 
     */
    MIN_PRIORITY_TO_INJECT: 0.05,
});

const DEBT_PRIORITIZATION_CONFIG = _definePrioritizationConfig();

/**
 * Export the configuration as a frozen object to ensure immutability and
 * prevent runtime modification of critical strategic weights and thresholds.
 */
module.exports = Object.freeze(DEBT_PRIORITIZATION_CONFIG);
