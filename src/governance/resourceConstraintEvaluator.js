/**
 * Component ID: RCE
 * Name: Resource Constraint Evaluator
 * Function: Provides dynamic, real-time operational context (e.g., CPU load, I/O latency, memory pressure)
 *           to the MCRA Engine (C-11) to inform the calculation of the Contextual Risk Floor (S-02).
 * GSEP Alignment: Stage 3 (P-01 Input)
 */

class ResourceConstraintEvaluator {
    constructor(metricsService) {
        this.metricsService = metricsService; // Dependency injection for core system metrics
    }

    /**
     * Gathers current environmental constraints and quantifies them into a contextual overhead metric.
     * @returns {Object} Constraint mapping (e.g., {cpu_utilization: 0.85, io_pressure: 'high', stability_factor: 0.1}).
     */
    getOperationalContext() {
        // Simulated retrieval of live system resource metrics
        const load = this.metricsService.getCurrentLoad();
        const memory = this.metricsService.getMemoryPressure();
        const iowait = this.metricsService.getIOWaitFactor();

        // The RCE quantifies environmental risk.
        let contextualOverhead = 0;
        if (load.cpu_util > 0.8) contextualOverhead += 0.3; // High CPU load increases risk
        if (memory.used_ratio > 0.95) contextualOverhead += 0.5; // Critical memory pressure drastically increases risk

        return {
            constraintMetric: Math.min(1.0, contextualOverhead), // Capped at 1.0 (maximum constraint)
            details: { load, memory, iowait }
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