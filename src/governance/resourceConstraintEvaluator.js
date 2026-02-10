/**
 * Component ID: RCE
 * Name: Resource Constraint Evaluator
 * Function: Provides dynamic, real-time operational context (e.g., CPU load, I/O latency, memory pressure)
 *           to the MCRA Engine (C-11) by calculating a weighted Constraint Factor derived from tunable thresholds.
 * GSEP Alignment: Stage 3 (P-01 Input)
 * Refactor V94.1: Introduced non-linear (squared deviation) penalty scaling and enhanced structural reporting.
 */

// Define types for clarity in TypeScript
interface ConstraintConfig {
    threshold: number;
    weight: number;
    severity_boost: number;
}

interface RawMetrics {
    cpu_util: number;
    memory_used_ratio: number;
    io_wait_factor: number;
    [key: string]: number;
}

interface TriggerDetail {
    metric: string;
    value: number;
    threshold: number;
    weight: number;
    penalty_contribution: number;
    type: 'CRITICAL' | 'PROXIMITY';
}

interface ScoreData {
    score: number;
    triggers: TriggerDetail[];
}

const DEFAULT_CONSTRAINTS: Record<string, ConstraintConfig> = {
    // Note: Metrics are expected to be normalized ratios (0.0 to 1.0)
    cpu_util: { threshold: 0.85, weight: 0.40, severity_boost: 2.0 }, 
    memory_used_ratio: { threshold: 0.90, weight: 0.50, severity_boost: 3.0 }, // Higher penalty for memory, critical path resource
    io_wait_factor: { threshold: 0.60, weight: 0.10, severity_boost: 1.5 }
};

// Proximity constants are now internalized within the WeightedConstraintScorer plugin logic.

class ResourceConstraintEvaluator {
    private metricsService: any;
    private config: Record<string, ConstraintConfig>;

    /**
     * @param {Object} metricsService Dependency injected service for system metrics access.
     * @param {Object} [constraintsConfig] Optional configuration, ideally sourced from RuntimeThresholdManager (RTM).
     */
    constructor(metricsService: any, constraintsConfig: Record<string, ConstraintConfig> = {}) {
        if (!metricsService) {
            throw new Error("MetricsService dependency is required for RCE.");
        }
        this.metricsService = metricsService;
        // Merge configuration for current operational context.
        this.config = {
            ...DEFAULT_CONSTRAINTS,
            ...constraintsConfig
        };
    }

    /**
     * Internal utility to gather all raw metrics.
     * Maps heterogeneous service outputs to a standardized, flat metric structure (0.0 to 1.0).
     * @returns {RawMetrics} Normalized raw metrics.
     */
    private _fetchRawMetrics(): RawMetrics {
        try {
            const load = this.metricsService.getCurrentLoad();
            const memory = this.metricsService.getMemoryPressure();
            const iowait = this.metricsService.getIOWaitFactor();

            return {
                // Use nullish coalescing to safely default to 0 if sub-properties are missing
                cpu_util: load?.cpu_util ?? 0,
                memory_used_ratio: memory?.used_ratio ?? 0,
                io_wait_factor: iowait?.iowait_factor ?? 0
            };
        } catch (error: any) {
            console.error("[RCE] Metric Fetch Critical Error:", error.message);
            // Return zeroed metrics if the underlying service fails, ensuring a safety default.
            return {
                cpu_util: 0,
                memory_used_ratio: 0,
                io_wait_factor: 0
            };
        }
    }

    /**
     * Delegates quantification of raw metrics to the external WeightedConstraintScorer plugin.
     * @param {RawMetrics} rawMetrics - Flattened current system metrics.
     * @returns {ScoreData} Calculated score and detailed list of triggered constraints.
     */
    private _calculateAggregateConstraintScore(rawMetrics: RawMetrics): ScoreData {
        // Execute the extracted, specialized scoring logic via the Kernel tool interface.
        const scoreData = DeepStateIntegrityTool.execute({
            toolName: 'WeightedConstraintScorer',
            args: {
                rawMetrics: rawMetrics,
                config: this.config
            }
        });
        
        return scoreData as ScoreData;
    }

    /**
     * Gathers current environmental constraints and quantifies them into a contextual overhead metric.
     * @returns {{constraintMetric: number, triggeredConstraints: TriggerDetail[], details: RawMetrics}} 
     */
    public getOperationalContext() {
        const rawMetrics = this._fetchRawMetrics();
        const scoreData = this._calculateAggregateConstraintScore(rawMetrics);

        return {
            constraintMetric: parseFloat(scoreData.score.toFixed(4)), // Normalized factor (0.0 to 1.0)
            triggeredConstraints: scoreData.triggers, // Detailed list of factors, including contribution
            details: rawMetrics
        };
    }

    /**
     * Primary interface for the MCRA Engine (C-11).
     * @returns {number} A normalized factor (0.0 to 1.0) representing current resource scarcity/instability.
     */
    public getConstraintFactor(): number {
        return this.getOperationalContext().constraintMetric;
    }
}

export = ResourceConstraintEvaluator;
