/**
 * PolicyEngine.js
 * Purpose: Interprets the RCDM.json ruleset and applies dynamic scoring/enforcement logic.
 */

class PolicyEngine {
    constructor(rcdmConfig) {
        this.config = rcdmConfig;
        if (!this.config || !this.config.rulesets) {
            throw new Error("PolicyEngine requires valid RCDM configuration.");
        }
    }

    getCurrentPhase(context) {
        // Determine operational phase based on context (e.g., current task, system status)
        // Default to 'evolution' unless overridden.
        const phaseId = context.current_task_type || 'evolution';
        return this.config.phases[phaseId] || this.config.phases.evolution;
    }

    evaluateProposal(context, proposalScoreMap) {
        const phase = this.getCurrentPhase(context);
        const ruleset = this.config.rulesets[phase.ruleset_id];
        
        if (ruleset.type === 'weighted_consensus') {
            let finalScore = 0;
            const matrix = this.config.weighting_matrix;
            const threshold = this.config.config.default_threshold_pct;

            for (const [actor, score] of Object.entries(proposalScoreMap)) {
                finalScore += score * (matrix[actor] || 0);
            }
            
            if (finalScore < threshold && phase.dynamic_adjustment && context.risk_score > 0.8) {
                // Trigger dynamic ruleset switch if failure is high risk
                return { decision: false, reason: 'Weighted consensus failed. Triggering mitigation.' };
            }

            return { 
                decision: finalScore >= threshold, 
                finalScore: finalScore 
            };
        }

        // ... Implementation for 'metric_compliance' and 'absolute_veto' types

        return { decision: false, reason: `Unknown ruleset type: ${ruleset.type}` };
    }
}

module.exports = PolicyEngine;