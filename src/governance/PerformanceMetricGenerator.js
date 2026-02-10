/**
 * src/governance/PerformanceMetricGenerator.js
 * Purpose: Calculates a standardized performance metric [0.0, 1.0] by applying weighted penalties
 * to deviations from optimal audit metrics (1.0). This metric feeds into the Trust Matrix.
 * 
 * Uses StructuralSchemaValidatorTool for input validation and the emergent 
 * WeightedDeviationScorer plugin for metric calculation.
 */

// Define the shape of audit data for type safety
interface AuditData {
    complianceScore: number;
    violationCount: number;
    efficiencyScore: number;
}

// Type declarations for assumed global tool interfaces (simulating imports)
declare const StructuralSchemaValidatorTool: {
    validate: (data: any, schema: any) => { isValid: boolean, errors: string[] };
};

declare const WeightedDeviationScorer: {
    execute: (args: {
        baseScore?: number,
        weightedDeviations?: { score: number, weight: number }[],
        fixedPenalties?: { count: number, penaltyPerCount: number }[]
    }) => number;
};


class PerformanceMetricGenerator {
    
    /**
     * Standard configuration for governing the impact of audit data deviations.
     * Weights represent the maximum impact on the final score (0.0 to 1.0) for a full deviation.
     */
    static DEFAULT_WEIGHTS = {
        // Max negative impact if complianceScore is 0.0 (e.g., score reduction of up to 0.4)
        COMPLIANCE_DEVIATION_WEIGHT: 0.4,
        
        // Max negative impact if efficiencyScore is 0.0 (e.g., score reduction of up to 0.3)
        EFFICIENCY_DEVIATION_WEIGHT: 0.3,
        
        // Fixed deduction applied per discrete policy violation instance
        POLICY_VIOLATION_PENALTY: 0.15
    };

    /**
     * Defines the expected structure and constraints for audit data input validation.
     */
    static AUDIT_DATA_SCHEMA = {
        complianceScore: { type: 'number', min: 0.0, max: 1.0, required: true },
        efficiencyScore: { type: 'number', min: 0.0, max: 1.0, required: true },
        // violationCount must be a non-negative integer
        violationCount: { type: 'number', min: 0, integer: true, required: true } 
    };

    private weights: typeof PerformanceMetricGenerator.DEFAULT_WEIGHTS;

    /**
     * @param {Object} [config={}] - Optional configuration overrides for weight distribution.
     */
    constructor(config: Partial<typeof PerformanceMetricGenerator.DEFAULT_WEIGHTS> = {}) {
        this.weights = { ...PerformanceMetricGenerator.DEFAULT_WEIGHTS, ...config };
    }

    /**
     * Synthesizes a unified trust metric based on recent operational performance data.
     * 
     * @param {string} actorId - The ID of the component being audited.
     * @param {Partial<AuditData>} auditData - Aggregated and normalized data points for a specific actor.
     * @returns {number} The calculated performance metric between 0.0 and 1.0.
     */
    generateMetric(actorId: string, auditData: Partial<AuditData>): number {
        
        // 1. Apply defaults
        const defaultedData: AuditData = {
            complianceScore: auditData.complianceScore ?? 1.0,
            violationCount: auditData.violationCount ?? 0,
            efficiencyScore: auditData.efficiencyScore ?? 1.0,
        };

        // 2. Validation using StructuralSchemaValidatorTool
        const validationResult = StructuralSchemaValidatorTool.validate(defaultedData, PerformanceMetricGenerator.AUDIT_DATA_SCHEMA);
        
        if (!validationResult.isValid) {
            throw new Error(`Audit Data Validation Failed for actor ${actorId}: ${validationResult.errors.join('; ')}`);
        }
        
        const { complianceScore, violationCount, efficiencyScore } = defaultedData;

        // 3. Calculation using the WeightedDeviationScorer plugin
        
        const scoringArguments = {
            baseScore: 1.0,
            weightedDeviations: [
                { 
                    score: complianceScore, 
                    weight: this.weights.COMPLIANCE_DEVIATION_WEIGHT 
                },
                { 
                    score: efficiencyScore, 
                    weight: this.weights.EFFICIENCY_DEVIATION_WEIGHT 
                }
            ],
            fixedPenalties: [
                {
                    count: violationCount,
                    penaltyPerCount: this.weights.POLICY_VIOLATION_PENALTY
                }
            ]
        };

        return WeightedDeviationScorer.execute(scoringArguments);
    }
}

module.exports = PerformanceMetricGenerator;