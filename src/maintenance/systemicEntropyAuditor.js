/**
 * Component ID: SEA
 * Systemic Entropy Auditor (SEA)
 * 
 * Responsibility: Monitors system complexity and architectural debt post-mutation. 
 * It actively identifies sources of entropy (code bloat, high coupling, redundant governance overhead)
 * and prioritizes mandatory simplification or refactoring proposals (C-13 inputs).
 * 
 * GSEP Integration:
 * - Operates during Stage 5 (Post-Execution) after FBA aggregation.
 * - Outputs 'Entropy Debt Index (EDI)' metrics used by C-13 for strategic planning.
 */

class SystemicEntropyAuditor {
    constructor(metricsService, strategicCache) {
        this.metrics = metricsService; 
        this.cache = strategicCache;
        this.COMPLEXITY_THRESHOLD = 0.85; // Defines acceptable architectural debt limit
    }

    /**
     * Calculates the Entropy Debt Index (EDI) based on coupling, size, and governance overhead.
     * @param {Object} postMutationMetrics Metrics derived from FBA/PEIQ.
     * @returns {number} EDI Score (0=Low Debt, 1=Critical Debt).
     */
    calculateEntropyDebt(postMutationMetrics) {
        const { couplingFactor, lineIncrease, governanceOverhead } = postMutationMetrics;
        // Weighted calculation focusing on persistent architectural strain
        return (couplingFactor * 0.4) + (lineIncrease * 0.3) + (governanceOverhead * 0.3);
    }

    /**
     * Analyzes current system metrics and proposes mandatory maintenance goals if threshold exceeded.
     * @param {Object} postMutationMetrics FBA collected data.
     */
    auditAndProposeRefinement(postMutationMetrics) {
        const edi = this.calculateEntropyDebt(postMutationMetrics);

        if (edi > this.COMPLEXITY_THRESHOLD) {
            console.warn(`[SEA] High Entropy Debt Detected (EDI: ${edi.toFixed(2)}). Mandating corrective action.`);
            
            const mandatoryGoal = {
                id: `MAINTENANCE-${Date.now()}`,
                mandate: 'Architectural Simplification',
                scope: 'Targeted reduction of system coupling based on EDI trigger.',
                priority: 9, // High priority maintenance
                source: 'SEA'
            };
            
            // Push mandatory goal directly to the Strategic Intent Cache (C-13)
            this.cache.submitMandatoryIntent(mandatoryGoal);
            return true;
        }
        return false;
    }
}

module.exports = SystemicEntropyAuditor;
