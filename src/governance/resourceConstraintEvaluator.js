/**
 * Component ID: RCE
 * Name: Resource Constraint Evaluator
 * Function: Provides dynamic, real-time operational context (e.g., CPU load, I/O latency, memory pressure)
 *           to the MCRA Engine (C-11) by calculating a weighted Constraint Factor derived from tunable thresholds.
 * GSEP Alignment: Stage 3 (P-01 Input)
 */

const DEFAULT_CONSTRAINTS = {
    cpu_util: { threshold: 0.85, weight: 0.40, severity_boost: 1.5 }, // High utilization
    memory_used_ratio: { threshold: 0.90, weight: 0.50, severity_boost: 2.0 }, // Near critical memory pressure
    io_wait_factor: { threshold: 0.60, weight: 0.10, severity_boost: 1.2 } // Significant I/O wait
};

class ResourceConstraintEvaluator {
    /**
     * @param {Object} metricsService Dependency injected service for system metrics access.
     * @param {Object} [constraintsConfig] Optional configuration to override default risk thresholds and weights.
     */
    constructor(metricsService, constraintsConfig = {}) {
        this.metricsService = metricsService;
        // Merge provided configuration over defaults. In a deployed environment, this would be provided by RTM.
        this.config = {
            ...DEFAULT_CONSTRAINTS,
            ...constraintsConfig
        };
    }

    /**
     * Internal utility to gather all raw metrics.
     * @returns {Object} Raw metrics structure.
     */
    _fetchRawMetrics() {
        const load = this.metricsService.getCurrentLoad();
        const memory = this.metricsService.getMemoryPressure();
        // Assuming metrics service provides a structure that can be flattened based on config keys.
        const iowait = this.metricsService.getIOWaitFactor();

        // Standardizing the flat structure for easy configuration-based processing
        return {
            cpu_util: load.cpu_util,
            memory_used_ratio: memory.used_ratio,
            io_wait_factor: iowait.iowait_factor
        };
    }

    /**
     * Quantifies raw metrics into a weighted, normalized constraint score using non-linear scaling beyond thresholds.
     * @param {Object} rawMetrics - Flattened current system metrics.
     * @returns {{score: number, triggers: Array<string>}} Calculated score and list of triggered constraints.
     */
    _calculateAggregateConstraintScore(rawMetrics) {
        let totalWeightedScore = 0;
        let totalWeight = 0;
        const triggeredConstraints = [];

        for (const [metricKey, config] of Object.entries(this.config)) {
            const value = rawMetrics[metricKey];
            if (value === undefined) continue; // Skip if metric not available

            const { threshold, weight, severity_boost } = config;
            totalWeight += weight;

            if (value > threshold) {
                // Calculate ratio above threshold
                const ratioAboveThreshold = Math.max(0, (value - threshold)); 
                
                // Use a dynamic risk multiplier: exponentially penalize resources deep into critical territory.
                const riskMultiplier = 1 + ratioAboveThreshold * severity_boost * 2; 

                const metricScore = weight * Math.min(3.0, riskMultiplier); // Cap multiplier influence

                totalWeightedScore += metricScore;
                triggeredConstraints.push(metricKey);
            } else if (value > threshold * 0.75) {
                // Proximity penalty: apply a minor cost for being close to the critical zone
                totalWeightedScore += weight * 0.1;
            }
        }

        // Normalize the score based on the total configured weight, capped at 1.0 (Critical Constraint)
        const normalizedScore = Math.min(1.0, totalWeightedScore / totalWeight);

        return {
            score: normalizedScore,
            triggers: triggeredConstraints
        };
    }


    /**
     * Gathers current environmental constraints and quantifies them into a contextual overhead metric.
     * @returns {{constraintMetric: number, triggeredConstraints: Array<string>, details: Object}} 
     */
    getOperationalContext() {
        const rawMetrics = this._fetchRawMetrics();
        const scoreData = this._calculateAggregateConstraintScore(rawMetrics);

        return {
            constraintMetric: scoreData.score, // Normalized factor (0.0 to 1.0)
            triggeredConstraints: scoreData.triggers, // Explicit list of factors driving the score up
            details: rawMetrics
        };
    }

    /**
     * Primary interface for the MCRA Engine (C-11).
     * @returns {number} A normalized factor (0.0 to 1.0) representing current resource scarcity/instability.
     */
    getConstraintFactor() {
        return this.getOperationalContext().constraintMetric;
    }
}

module.exports = ResourceConstraintEvaluator;