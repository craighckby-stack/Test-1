/**
 * Component ID: EDP (Efficiency Debt Prioritizer)
 * Role: Quantifies and prioritizes low-risk, high-impact maintenance tasks (Efficiency Debt).
 * Integrates complexity, potential resource savings, and deployment risk tolerance using configurable weighted metrics.
 */
class EfficiencyDebtPrioritizer {
    
    /**
     * @param {Object} seaInterface - Interface to the Systemic Entropy Auditor (SEA).
     * @param {Object} [scoringConfig={}] - Weights and thresholds for the prioritization algorithm.
     */
    constructor(seaInterface, scoringConfig = {}) {
        this.sea = seaInterface;
        this.debtQueue = [];

        // Default prioritization constants (can be overridden via scoringConfig)
        this.config = {
            IMPACT_WEIGHT: 0.65,        // Prioritization emphasis on potential savings
            COMPLEXITY_PENALTY: 0.35,   // Penalty for estimated required effort
            RISK_THRESHOLD: 0.15,       // Items above this normalized risk score are rejected for automation
            ...scoringConfig
        };
    }

    /**
     * Calculates the normalized impact score based on resource metrics reported by SEA.
     * Assumes debt.metrics contains 'savings_potential' (0.0 to 1.0).
     * @param {Object} debt - Debt artifact containing metrics.
     * @returns {number} Normalized impact (0.0 to 1.0).
     */
    _calculateImpact(debt) {
        // Robust handling for missing metrics
        return debt.metrics ? Math.min(1.0, debt.metrics.savings_potential || 0) : 0;
    }

    /**
     * Calculates the overall priority score using the weighted formula.
     * Priority = (Impact * W_Impact) - (Complexity * W_Complexity)
     * @param {Object} debt
     * @returns {number} Priority score (higher is better).
     */
    _calculatePriorityScore(debt) {
        const impact = this._calculateImpact(debt);
        // Assumes debt.metrics.complexity is normalized (0.0 to 1.0)
        const complexity = debt.metrics ? (debt.metrics.complexity || 1.0) : 1.0;

        return (impact * this.config.IMPACT_WEIGHT) - (complexity * this.config.COMPLEXITY_PENALTY);
    }

    /**
     * Ingests and processes debt artifacts, filtering by risk threshold, and assigning priority.
     * @param {Array<Object>} debtArtifacts - List of structural debts/simplification proposals, expected to include risk_level.
     */
    ingestAndScoreDebt(debtArtifacts) {
        const scoredDebts = debtArtifacts
            // Stage M-02 Risk Threshold Filter
            .filter(debt => (debt.risk_level || 0) <= this.config.RISK_THRESHOLD)
            .map(debt => ({
                ...debt,
                priority: this._calculatePriorityScore(debt),
                impactScore: this._calculateImpact(debt)
            }));

        // Sort: Highest priority first (descending)
        this.debtQueue = scoredDebts.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Retrieves the top N debt items suitable for immediate GSEP Stage 1 injection.
     * @param {number} n - Number of proposals to generate.
     * @returns {Array<Object>} Optimized mutation proposals structured for GSEP intake.
     */
    getPrioritizedProposals(n = 5) {
        return this.debtQueue.slice(0, n).map(item => ({
            type: 'EfficiencyMutation',
            source: 'EDP/v94.1',
            priority_score: item.priority,
            description: `Efficiency Debt Refactoring: ${item.description}`,
            target_file: item.target_file,
            scope_data: item.details,
            confidence: 0.95 // High confidence due to pre-filtered low risk
        }));
    }
}

module.exports = EfficiencyDebtPrioritizer;