/**
 * PolicyEngine.js
 * Purpose: Interprets the RCDM ruleset and applies dynamic scoring/enforcement logic.
 * Refactored for modularity, explicit configuration handling, and efficiency.
 */

// Interface simulation for the external plugin call
interface IWeightedScoreAccumulator {
    execute(proposalScores: Record<string, number>, weightingMatrix: Record<string, number>): { score: number };
}

// NOTE: In a real environment, this dependency would be injected or accessed 
// via a Kernel API. For demonstration, we assume an external mechanism exists.
declare const WeightedScoreAccumulator: IWeightedScoreAccumulator;


class PolicyEngine {
    private rulesets: any;
    private phases: any;
    private weightingMatrix: Record<string, number>;
    private defaultThreshold: number;

    /**
     * @param {Object} rcdmConfig - The Root Configuration Data Model (RCDM).
     */
    constructor(rcdmConfig: any) {
        if (!rcdmConfig || !rcdmConfig.rulesets || !rcdmConfig.phases) {
            throw new Error("[PolicyEngine] Requires valid RCDM configuration with rulesets and phases.");
        }
        
        // Optimize config access by localizing critical paths
        this.rulesets = rcdmConfig.rulesets;
        this.phases = rcdmConfig.phases;
        this.weightingMatrix = rcdmConfig.weighting_matrix || {};
        
        // Ensure default parameters are easily accessible
        this.defaultThreshold = (rcdmConfig.config && rcdmConfig.config.default_threshold_pct) || 0.5;
    }

    /**
     * Determines the operational phase based on context.
     * @param {Object} context - The current operational context.
     * @returns {Object} The configuration object for the active phase.
     */
    getCurrentPhase(context: any): any {
        const phaseId = context.current_task_type || 'evolution';
        const phase = this.phases[phaseId];
        
        if (!phase) {
             // Use a defined fallback if configuration is missing the specific phase
             return this.phases.evolution || { ruleset_id: 'default_fallback' }; 
        }
        return phase;
    }

    /**
     * Executes the evaluation based on the 'weighted_consensus' ruleset type.
     */
    _evaluateWeightedConsensus(phase: any, context: any, proposalScoreMap: Record<string, number>) {
        const ruleset = this.rulesets[phase.ruleset_id];
        
        // Use the ruleset's specific threshold, falling back to engine default
        const threshold = ruleset.threshold || this.defaultThreshold;

        // --- PLUGIN CALL INTEGRATION ---
        // Offload the complex score calculation (aggregation loop) to the external plugin
        const { score: finalScore } = WeightedScoreAccumulator.execute(
            proposalScoreMap, 
            this.weightingMatrix
        );
        // --- END PLUGIN CALL ---
        
        // Dynamic Adjustment Logic (Mitigation Trigger)
        if (finalScore < threshold) {
            // Check if dynamic override is enabled for the phase and risk is high (e.g., >= 0.8)
            if (phase.dynamic_adjustment && context.risk_score >= 0.8) {
                // Signal external governance loop to trigger mitigation or ruleset change
                return { 
                    decision: false, 
                    finalScore: finalScore,
                    reason: 'Weighted consensus failed below high-risk threshold. Mitigation required.' 
                }; 
            }
        }

        return { 
            decision: finalScore >= threshold, 
            finalScore: finalScore 
        };
    }
    
    /**
     * Placeholder for future ruleset types.
     */
    _evaluateMetricCompliance(phase: any, context: any, proposalScoreMap: Record<string, number>) {
        return { decision: false, reason: 'Metric compliance ruleset type not yet implemented.' };
    }

    /**
     * Main entry point for proposal evaluation.
     * @param {Object} context - Current system and operational state.
     * @param {Object<string, number>} proposalScoreMap - Actor scores for the proposal.
     * @returns {{decision: boolean, finalScore?: number, reason: string}}
     */
    evaluateProposal(context: any, proposalScoreMap: Record<string, number>) {
        const phase = this.getCurrentPhase(context);
        const rulesetId = phase.ruleset_id;
        const ruleset = this.rulesets[rulesetId];

        if (!ruleset) {
            return { decision: false, reason: `Ruleset '${rulesetId}' not found or improperly configured.` };
        }
        
        switch (ruleset.type) {
            case 'weighted_consensus':
                return this._evaluateWeightedConsensus(phase, context, proposalScoreMap);
                
            case 'metric_compliance':
                return this._evaluateMetricCompliance(phase, context, proposalScoreMap);
                
            // case 'absolute_veto':

            default:
                return { decision: false, reason: `Unknown ruleset type: ${ruleset.type}` };
        }
    }
}

module.exports = PolicyEngine;