/**
 * Proposal Metrics Engine (PME) v94.2 - Enhanced Calibration Core
 * Responsible for consuming aggregated data from PSHI and outputting actionable metrics
 * for ARCH-ATM trust score calibration and AGI-C-12 CIW refinement.
 * Implements a configurable, segmented scoring pipeline using explicit normalization and
 * context-specific modulation layers.
 */
class ProposalMetricsEngine {
    constructor(historyIndexInstance, config = {}) {
        if (!historyIndexInstance || typeof historyIndexInstance.calculateAgentSuccessRate !== 'function') {
            throw new Error("PME requires a valid ProposalHistoryIndex (PSHI) instance.");
        }
        this.index = historyIndexInstance;

        // Default Scoring Weights and Configuration
        this.config = {
            // Weights for blending raw rate and recent performance (must sum close to 1.0)
            performanceWeights: config.performanceWeights || { rawRate: 0.65, recentDecayWeight: 0.35 },
            // Factors for Volume Normalization
            volumeNormalization: config.volumeNormalization || { minConfidenceThreshold: 10, maxConfidenceProportion: 0.5 },
            // Context Multipliers
            contextWeights: config.contextWeights || {
                "CRITICAL_SYSTEM": 1.75, // Increased penalty/reward weight
                "UTILITY_ADAPTER": 1.0,
                "UI_RENDER": 0.8
            },
            // Penalty application threshold
            lowScoreThreshold: config.lowScoreThreshold || 0.6
        };

        // Validate weights for transparency
        const sum = this.config.performanceWeights.rawRate + this.config.performanceWeights.recentDecayWeight;
        if (Math.abs(sum - 1.0) > 0.01) {
            console.warn(`PME Performance weights sum to ${sum}, not 1.0. Results may be skewed.`);
        }
    }

    /**
     * Calculates the time-decayed and context-weighted trust score for an agent (ARCH-ATM output).
     * Follows a three-stage pipeline: 1. Performance Blend, 2. Volume Confidence Nudge, 3. Context Modulation.
     * @param {string} agentId - The agent identifier.
     * @param {string} currentContext - The context of the proposal being evaluated.
     * @returns {number} Calibrated Trust Score (0.0 to 1.0).
     */
    getCalibratedAgentTrustScore(agentId, currentContext) {
        const snapshot = this.index.calculateAgentSuccessRate(agentId);
        const cfg = this.config;

        if (snapshot.totalProposals < cfg.volumeNormalization.minConfidenceThreshold) {
            // Insufficient data, return neutral or confidence-adjusted score based on raw rate
            return snapshot.rawRate > 0.5 ? 0.5 + (snapshot.rawRate - 0.5) * 0.5 : 0.5; 
        }

        // --- Stage 1: Performance Blend (Temporal Prioritization) ---
        // Blend raw success rate with the highly time-decayed recent quality score.
        let trustScore = 
            (cfg.performanceWeights.rawRate * snapshot.rawRate) +
            (cfg.performanceWeights.recentDecayWeight * snapshot.recentWeight);

        // --- Stage 2: Volume Confidence Normalization ---
        // Prevents over-reaction to high scores based on insufficient history.
        const maxProposals = this.index.maxHistorySize;
        const normalizedVolume = snapshot.totalProposals / maxProposals;
        
        // Confidence factor smoothly scales from 0 (min volume) to 1 (max volume proportion)
        const confidenceFactor = Math.min(1.0, normalizedVolume / cfg.volumeNormalization.maxConfidenceProportion);
        
        // Nudge: Pulls the score towards the neutral point (0.5) if confidence is low.
        trustScore = 0.5 + (trustScore - 0.5) * confidenceFactor;

        // --- Stage 3: Contextual Modulation ---
        const contextMultiplier = cfg.contextWeights[currentContext] || 1.0;
        
        if (contextMultiplier !== 1.0) {
            // Dynamic adjustment: Apply amplified penalty/reward based on criticality.
            const deviationFromNeutral = trustScore - 0.5;
            // Amplify the deviation based on context criticality
            trustScore = 0.5 + (deviationFromNeutral * contextMultiplier);
            
            // Criticality Dampening: Apply an exponential penalty for low scores in high-risk contexts
            if (contextMultiplier > 1.0 && trustScore < cfg.lowScoreThreshold) {
                const criticalityPenalty = (contextMultiplier - 1.0) * Math.pow(cfg.lowScoreThreshold - trustScore, 2);
                trustScore -= criticalityPenalty;
            }
        }
        
        // Clamp and return
        return Math.min(1.0, Math.max(0.01, trustScore));
    }

    /**
     * Retrieves dynamic weighting adjustments for CIW inputs based on global failure patterns.
     * This calibrates AGI-C-12 based on observed risks (e.g., if topology X fails often, increase
     * the weight given to CIW inputs related to topology X).
     * @param {string} topologyType - The structural failure signature.
     * @returns {number} Dynamic Weight Multiplier (>= 1.0).
     */
    getDynamicCIWAdjustments(topologyType) {
        // PSHI provides the normalized historical frequency of failures for this topology type [0, 1].
        const bias = this.index.getFailurePatternBias(topologyType);
        
        // Exponentially scales the bias ratio [0, 1] to a multiplier [1.0, 4.0] for dynamic weighting.
        return 1.0 + (bias * bias * 3.0); 
    }
}

module.exports = ProposalMetricsEngine;