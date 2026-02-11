/**
 * Evolutionary_Risk_Assessor.js
 * 
 * Utility module to analyze proposed code evolutions against GPC risk profiles.
 * Abstracted policy enforcement logic into EvolutionPolicyEnforcer plugin.
 * 
 * Dependencies: GSEP_Config/GPC.json
 */

import { loadConfig } from '../GSEP_Config/ConfigLoader';

// --- External Plugin Declarations ---
// Quantitative Scorer handles metric processing
declare const QuantitativeEvolutionScorer: { execute: (metrics: { [key: string]: any }, config: { [key: string]: any }) => { quantitativeRisk: number, riskScore: number, efficacyScore: number } };

// Policy Enforcer handles GPC compliance rules
declare const EvolutionPolicyEnforcer: { 
    determineRecommendation: (quantitativeRisk: number, riskToleranceLevel: string, estimatedImpact: number, minimumRequiredGain: number) => string 
};

const GPC = loadConfig('GPC');
const { risk_tolerance, target_efficiency_gain_min } = GPC.protocol_evolution_control;

// Configuration parameters for the scorer (using explicit values matching original logic)
const SCORER_CONFIG = {
    complexityThreshold: 50,
    instabilityThreshold: 0.01,
    efficacyWeight: 0.6,
    complexityRiskWeight: 0.8,
    instabilityRiskWeight: 0.5
    // targetEfficiencyMin is passed implicitly via GPC in policy enforcement
};

/**
 * Calculates the risk and predicted efficacy of a proposed code change object.
 * @param {object} proposal - The proposed refactoring/scaffolding object.
 * @param {object} currentMetrics - Real-time system performance metrics.
 * @returns {object} - Assessment score and recommendation.
 */
export function assessProposal(proposal, currentMetrics) {
    // 1. Prepare metrics for quantitative scoring
    const metrics = {
        estimatedImpact: proposal.metrics.predicted_cpu_reduction, // Example metric
        codeComplexityChange: proposal.metrics.cyclomatic_change,
        recent_errors: currentMetrics.recent_errors
    };

    // 2. Execute quantitative scoring
    const scoringResult = QuantitativeEvolutionScorer.execute(metrics, SCORER_CONFIG);
    const quantitativeRisk = scoringResult.quantitativeRisk;
    const estimatedImpact = metrics.estimatedImpact;

    // 3. Policy Enforcement based on GPC configuration via dedicated plugin
    const recommendation = EvolutionPolicyEnforcer.determineRecommendation(
        quantitativeRisk,
        risk_tolerance,
        estimatedImpact,
        target_efficiency_gain_min
    );

    return {
        risk: quantitativeRisk,
        gain_metric: estimatedImpact,
        recommendation: recommendation,
        reasoning: `Risk tolerance: ${risk_tolerance}. Calculated risk: ${quantitativeRisk.toFixed(2)}.`
    };
}