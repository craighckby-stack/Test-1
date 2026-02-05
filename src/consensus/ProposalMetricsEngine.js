/**
 * Proposal Metrics Engine (PME) v94.1
 * Responsible for consuming aggregated data from PSHI and outputting actionable metrics
 * for ARCH-ATM trust score calibration and AGI-C-12 CIW refinement.
 * Implements decay functions and context-specific weighting algorithms, separating statistical
 * complexity from the index data structure.
 */
class ProposalMetricsEngine {
    constructor(historyIndexInstance, config = {}) {
        if (!historyIndexInstance || typeof historyIndexInstance.calculateAgentSuccessRate !== 'function') {
            throw new Error("PME requires a valid ProposalHistoryIndex instance.");
        }
        this.index = historyIndexInstance;
        // Configuration for complex weighting and temporal depreciation
        this.decayCoefficient = config.decayCoefficient || 0.95; 
        this.contextWeights = config.contextWeights || { 
            "CRITICAL_SYSTEM": 1.5, // Higher weight increases penalty for failures here
            "UTILITY_ADAPTER": 1.0,
            "UI_RENDER": 0.8
        };
    }

    /**
     * Calculates the time-decayed and context-weighted trust score for an agent (ARCH-ATM output).
     * Combines raw success rate, recent quality scores, and temporal factors.
     * @param {string} agentId - The agent identifier.
     * @param {string} currentContext - The context of the proposal being evaluated.
     * @returns {number} Calibrated Trust Score (0.0 to 1.0).
     */
    getCalibratedAgentTrustScore(agentId, currentContext) {
        const snapshot = this.index.calculateAgentSuccessRate(agentId);

        if (snapshot.totalProposals === 0) {
            return 0.5; // Neutral starting score
        }

        // 1. Initial blend of success rate and recent CIW quality
        let trustScore = (0.7 * snapshot.rawRate) + (0.3 * snapshot.recentWeight);

        // 2. Apply Temporal/Volume Normalization
        // This function discourages over-reliance on ancient data or under-relying on recent activity.
        const proposalRatio = snapshot.totalProposals / this.index.maxHistorySize;
        const confidenceFactor = Math.min(1.0, proposalRatio * 2); // Factor increases confidence as history grows
        
        trustScore = 0.5 + (trustScore - 0.5) * confidenceFactor; // Nudges score closer to 0.5 if data is sparse

        // 3. Contextual Modulation
        const contextMultiplier = this.contextWeights[currentContext] || 1.0;
        
        // Example adjustment: Apply a higher penalty if the score is low and the context is critical.
        if (contextMultiplier > 1.0 && trustScore < 0.6) {
            trustScore -= (contextMultiplier - 1.0) * (0.6 - trustScore);
        }
        
        // Clamp and return
        return Math.min(1.0, Math.max(0.01, trustScore));
    }

    /**
     * Retrieves dynamic weighting adjustments for CIW inputs based on global failure patterns.
     * This calibrates AGI-C-12 based on observed risks.
     * @param {string} topologyType - The structural failure signature.
     * @returns {number} Dynamic Weight Multiplier (>= 1.0 for increased emphasis/penalty).
     */
    getDynamicCIWAdjustments(topologyType) {
        const bias = this.index.getFailurePatternBias(topologyType);
        
        // Linearly scales the bias ratio [0, 1] to a multiplier [1.0, 3.0] for dynamic weighting
        return 1.0 + (bias * 2.0); 
    }
}

module.exports = ProposalMetricsEngine;