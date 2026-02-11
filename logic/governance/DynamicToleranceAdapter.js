/**
 * Module: DynamicToleranceAdapter (DTA)
 * Responsibility: Calculates and proposes dynamic adjustments (DAF - Dynamic Adaptation Factors)
 * to the GTCM baseline tolerance margins based on real-time operational volatility and system health vectors.
 *
 * Inputs: System/VulnerabilitySensorData, Performance/EfficacyFeedbackLoop, Risk/VectorFusionScores
 * Outputs: DAF Configuration Update Object
 */

/**
 * @interface IDynamicFactorHeuristicDeriver
 * Defined in plugin: DynamicFactorHeuristicDeriver
 */

class DynamicToleranceAdapter {
    private config: any;
    private dfhdTool: any; // IDynamicFactorHeuristicDeriver

    /**
     * @param gtcm_config The governance configuration including baseline margins.
     * @param toolKit Contains the DynamicFactorHeuristicDeriver plugin.
     */
    constructor(gtcm_config: any, toolKit: { DynamicFactorHeuristicDeriver: any }) {
        this.config = gtcm_config;
        // Use a clearer, standardized variable name
        this.dfhdTool = toolKit.DynamicFactorHeuristicDeriver;
    }

    /**
     * Calculates the dynamic adaptation factor and proposes a new tolerance margin.
     * @param metric_key The key identifying the governance metric.
     * @param sensor_data Sensor data providing dynamic input metrics (like volatility).
     * @returns Proposed margin adjustment object.
     */
    calculateDynamicFactor(metric_key: string, sensor_data: Map<string, number>): object {
        // Retrieve baseline configuration
        const policyConfig = this.config.governance_gates[metric_key]?.policy;
        
        if (!policyConfig) {
            console.warn(`DTA: Metric key ${metric_key} missing policy configuration.`);
            return { metric_key, proposed_margin: null, adjustment_factor: 1.0, adaptation_reason: "Configuration missing" };
        }

        let current_margin = policyConfig.baseline_tolerance_margin;
        
        // Retrieve dynamic input
        const volatility_index = sensor_data.get('system_volatility') || 0;
        
        // Define specific parameters for this adjustment heuristic
        const adjustmentParams = { indexWeight: 0.1, baseFactor: 1.0 };
        
        const calculationResult = this.dfhdTool.calculate(
            current_margin, 
            volatility_index, 
            adjustmentParams
        );
        
        // Proposal based on system context
        return {
            'metric_key': metric_key,
            'proposed_margin': calculationResult.proposedValue,
            'adjustment_factor': calculationResult.adjustmentFactor,
            'adaptation_reason': `Adjusted by DTA due to volatility index ${volatility_index.toFixed(3)} (Factor: ${calculationResult.adjustmentFactor.toFixed(3)})`
        };
    }

    generateAdaptationProposal(system_state: Map<string, number>): object {
        // Note: The specific metrics ('SystemicRiskExposure', 'PerformanceEfficacy') are hardcoded, 
        // suggesting this adapter specifically targets these two system aspects.
        const risk_adjustment = this.calculateDynamicFactor('SystemicRiskExposure', system_state);
        const efficacy_adjustment = this.calculateDynamicFactor('PerformanceEfficacy', system_state);
        
        return {
            'adaptation_id': `DTA_PROP_${Date.now()}`,
            'proposals': [risk_adjustment, efficacy_adjustment]
        };
    }
}
module.exports = DynamicToleranceAdapter;