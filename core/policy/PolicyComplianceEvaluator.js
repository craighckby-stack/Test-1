/*
 * Policy Compliance Evaluator (PCE)
 * Objective: Real-time validation of current system state against the Adaptive Policy Matrix (APM).
 * Role: High-frequency operational watchdog, executing AdaptiveDeviationHandling actions.
 * Optimization Note: Configuration initialization is now pre-processed for O(1) weight lookups.
 */

import { APM } from '../config/governance/APM-99.0_CORE.json';
import { SystemActionDispatcher } from '../system/SystemActionDispatcher.js'; // Decouples action execution from evaluation
// Assuming PolicyDeviationScorer is available via injection or import
// @ts-ignore
import { PolicyDeviationScorer } from '../tools/PolicyDeviationScorer.js'; 
import { ThresholdReactionMatcher } from '../plugins/ThresholdReactionMatcher.js'; 

class PolicyComplianceEvaluator {
    /** @type {Object.<number, number>} Policy Code -> Weight */
    weightMap = {};
    
    /** @type {Object} */
    trustConfig = {};

    /** @type {PolicyDeviationScorer} */
    #policyScorer;

    /** @type {ThresholdReactionMatcher} */
    #reactionMatcher;

    /** 
     * @type {Object.<number, string>} Maps Policy Code to expected metric key name. 
     */
    #policyMetricMap = {
        1: 'securityViolationRate',
        2: 'efficiencyLossSigma',
    };

    constructor() {
        const matrix = APM.AdaptiveDeviationHandling;

        // 1. Optimize Weights: Transform Array into Map/Object for O(1) lookup in high-frequency calculation.
        this.weightMap = matrix.ADH_Policy_Weights.reduce((acc, weight) => {
            acc[weight.Code] = weight.Weight;
            return acc;
        }, {});

        // 2. Initialize Core Policy Configuration
        this.trustConfig = APM.TrustDefinitions.T_Adaptive_Thresholds;

        // 3. Initialize deviation scorer plugin
        this.#policyScorer = new PolicyDeviationScorer({
            weightMap: this.weightMap,
            policyMetricMap: this.#policyMetricMap
        });

        // 4. Initialize reaction matcher plugin, abstracting the threshold lookup logic
        this.#reactionMatcher = new ThresholdReactionMatcher(matrix.ADH_ReactionMatrix.Thresholds);

        // Dependency check (optional, but good practice)
        if (typeof SystemActionDispatcher === 'undefined') {
             // Use throwing error here for mission-critical dependency
             throw new Error("PCE requires SystemActionDispatcher for compliance enforcement.");
        }
    }

    /**
     * Main evaluation routine to validate operational state against adaptive policies.
     * @param {Object} metrics - Real-time system performance metrics.
     * @param {Object} operationalContext - Contextual metadata (e.g., current mission phase).
     * @returns {boolean} True if a compliance action was dispatched, false otherwise.
     */
    evaluateSystemState(metrics, operationalContext) {
        // A. Primary Trust Policy Check (Fast fail evaluation)
        if (metrics.P99_CommitTime_ms > this.trustConfig.HighLatency.Scale) {
            console.warn(`[PCE Trust Violation] Latency breach: ${metrics.P99_CommitTime_ms}ms.`);
            SystemActionDispatcher.dispatchAction(this.trustConfig.HighLatency.Trigger, { type: 'trust_violation', metrics });
            return true;
        }

        // B. Calculate Composite Deviation Score using the dedicated scorer plugin
        const deviationScore = this.#policyScorer.execute({ metrics });

        // C. Determine and Execute Reaction using the abstracted matcher
        const reaction = this.#reactionMatcher.match(deviationScore);

        if (reaction) {
            console.warn(`[PCE Deviation] Score: ${deviationScore.toFixed(3)}. Policy Mandate: ${reaction.Action}`);
            SystemActionDispatcher.dispatchAction(reaction.Action, { score: deviationScore, metrics, context: operationalContext });
            return true;
        }
        return false;
    }
}

export const PCE = new PolicyComplianceEvaluator();