/**
 * CONTRACT: SCI (Strategic Cost Indexer)
 * PURPOSE: Calculates the Chronic Cost Index (C-01), a forward-looking scalar
 * quantification of potential long-term structural debt or required maintenance 
 * overhead induced by the proposed transition (SST).
 * 
 * INTEGRATION: Feeds VMO (L6) to influence the adaptive safety margin (epsilon),
 * ensuring high-debt proposals face a stricter finality gate.
 */

class StrategicCostIndexer {
    constructor(SPDM, SST_Payload, CMO_Config) {
        this.SPDM = SPDM; 
        this.SST_Payload = SST_Payload;
        this.config = CMO_Config;
        this.cost_weight_vector = this.loadCostVectors();
    }

    loadCostVectors() {
        // Weights derived from CMO for specific SST categories
        return this.config.SCI_Weights || {
            'default': 1.0,
            'major_dependency_change': 1.8,
            'protocol_expansion': 0.7
        };
    }

    /**
     * Calculates C-01 (Chronic Cost Index)
     * @returns {number} Scalar index C-01 (Range 0.0 - 10.0)
     */
    calculateC01() {
        const proposal_type = this.SST_Payload.type || 'default';
        const complexity_score = this.SST_Payload.components_affected || 1; 
        
        const weight = this.cost_weight_vector[proposal_type] || this.cost_weight_vector['default'];

        // Index = (Proposal complexity * Type Weight) + (Historical Systemic Debt Trend)
        const historical_debt_modifier = this.SPDM.queryAverageStructuralDebt(); 

        const C01 = (complexity_score * weight * 0.1) + (historical_debt_modifier * 0.5);

        // Clamp the scalar output for reliable VMO input
        return Math.min(10.0, Math.max(0.0, C01));
    }

    queryC01() {
        return {
            scalar: this.calculateC01(),
            id: 'C-01'
        };
    }
}

module.exports = { StrategicCostIndexer };