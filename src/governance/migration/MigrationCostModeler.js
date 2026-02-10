/**
 * Migration Cost Modeler (MCM) V1.0
 * Predicts CPU, Memory, I/O, and Time complexity for schema migrations based on
 * structural difference metrics provided by the SchemaAnalyzer.
 */
export class MigrationCostModeler {

    private config: {
        ioFactor: number;
        cpuFactor: number;
        baseOverheadMs: number;
    };

    // Assume dependency injection or global access to the kernel utility
    private weightedMetricDerivator: any; 

    /**
     * Creates a new Cost Modeler instance.
     * @param {object} configuration - Configuration specifying environmental constants (e.g., typical IO throughput).
     */
    constructor(configuration: Record<string, any> = {}) {
        this.config = { 
            ioFactor: configuration.ioFactor || 1.2,
            cpuFactor: configuration.cpuFactor || 0.85,
            baseOverheadMs: configuration.baseOverheadMs || 500
        };
        // CRITICAL: Accessing the injected plugin
        this.weightedMetricDerivator = globalThis.KRNL_PLUGINS?.WeightedMetricDerivator || { execute: () => 0 };
    }

    /**
     * Helper to call the weighted metric calculation plugin.
     * @param inputs The input data {complexity: N, breaking: M}.
     * @param weights The weight mapping.
     * @param scalingFactor The global scale.
     * @param baseOffset The base offset.
     * @returns {number}
     */
    private calculateScore(inputs: Record<string, number>, weights: Record<string, number>, scalingFactor: number = 1, baseOffset: number = 0): number {
        return this.weightedMetricDerivator.execute({
            inputs: inputs,
            definition: {
                weights: weights,
                scalingFactor: scalingFactor,
                baseOffset: baseOffset
            }
        });
    }

    /**
     * Estimates the full migration cost profile based on analysis inputs.
     * @param {object} diffAnalysis - The output structure from SchemaMigrationSimulationEngine.analyzeDifferential.
     * @returns {{durationMs: number, resources: {cpu: number, memory: number, io: number}}}
     */
    estimateCosts(diffAnalysis: { complexityScore: number, breakingChangesCount: number, dataTransformationRequired: boolean }): { durationMs: number, resources: { cpu: number, memory: number, io: number } } {
        const complexity = diffAnalysis.complexityScore;
        const breaking = diffAnalysis.breakingChangesCount;
        const inputs = { complexity, breaking };

        // --- 1. Time Duration Estimate ---
        // Time = Base + (Complexity * 1500 * CPU_F) + (Breaking * 500 * IO_F)

        // Contribution 1: CPU-bound complexity
        const cpuTimeContribution = this.calculateScore(
            inputs,
            { complexity: 1500 },
            this.config.cpuFactor
        );

        // Contribution 2: IO-bound breaking changes
        const ioTimeContribution = this.calculateScore(
            inputs,
            { breaking: 500 },
            this.config.ioFactor
        );
        
        const estimatedTime = this.config.baseOverheadMs + cpuTimeContribution + ioTimeContribution;

        // --- 2. Resource Estimation ---
        
        // CPU Usage: (complexity * 0.1) + (breaking * 0.5)
        const cpuUsage = this.calculateScore(inputs, {
            complexity: 0.1, 
            breaking: 0.5
        });

        // Memory Usage: (complexity * 0.05) + (breaking * 0.3)
        const memoryUsage = this.calculateScore(inputs, {
            complexity: 0.05,
            breaking: 0.3
        });

        // I/O Usage (Conditional Logic handled externally)
        let ioUsage: number;
        if (diffAnalysis.dataTransformationRequired) {
            // (breaking * 1.5) + (complexity * 0.1)
            ioUsage = this.calculateScore(inputs, {
                breaking: 1.5,
                complexity: 0.1
            });
        } else {
            // (complexity * 0.05)
            ioUsage = this.calculateScore(inputs, {
                complexity: 0.05
            });
        }

        return {
            durationMs: Math.ceil(estimatedTime),
            resources: {
                cpu: Math.min(10.0, cpuUsage), 
                memory: Math.min(10.0, memoryUsage), 
                io: Math.min(10.0, ioUsage) 
            }
        };
    }
}