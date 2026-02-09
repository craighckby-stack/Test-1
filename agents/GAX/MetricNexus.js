/**
 * MetricNexus (MN):
 * Centralized dynamic metric management system, now explicitly integrated with the Nexus-Database 
 * for persistent trend storage, fulfilling the CRITICAL DIRECTIVE: Integration Before Expansion.
 */
class MetricNexus {
    // Inject NexusInterface for persistent storage (Integration Requirement 2 & 3)
    constructor(AnalyticsStore, PolicyAuditor, NexusInterface) {
        this.analytics = AnalyticsStore;
        this.auditor = PolicyAuditor;
        this.nexus = NexusInterface;
        this.metricCache = {};
    }

    /**
     * Placeholder function for kernel capability metrics (MQM Alignment).
     * @returns {number}
     */
    getEvolutionQualityMetric() {
        // Simulated calculation based on internal state assessment patterns.
        // Logic leveraging MQM philosophy.
        const eqm = (this.getUFRM() * 0.4) + (this.getCFTM() * 0.3) + (this.getPolicyVolatility() * 0.3); 
        this.metricCache.EQM = eqm;
        return eqm;
    }

    /**
     * Calculates and returns the Unknown Factor Risk Metric (UFRM).
     * @returns {number}
     */
    getUFRM() {
        // Logic leveraging AnalyticsStore to calculate residual variance or unknown state space
        const ufrm = this.analytics.calculateResidualRisk();
        this.metricCache.UFRM = ufrm;
        return ufrm;
    }

    /**
     * Calculates and returns the Contextual Flux Trend Metric (CFTM).
     * @returns {number}
     */
    getCFTM() {
        // Logic leveraging real-time telemetry on system volatility
        const cftm = this.analytics.getHistoricalVolatilityFactor();
        this.metricCache.CFTM = cftm;
        return cftm;
    }

    /**
     * Calculates and returns the Policy Volatility Metric (PVM).
     * Used by PSR's projection handler.
     * @returns {number}
     */
    getPolicyVolatility() {
        const pvm = this.auditor.calculatePolicyChangeRate();
        this.metricCache.PVM = pvm;
        return pvm;
    }

    /**
     * [Integration] Logs the current metric snapshot and trends to the Nexus persistent storage.
     * Fulfills Integration Requirement: Store trends in Nexus memory.
     * @param {Object} metrics - The calculated metric snapshot.
     */
    async logMetricsToNexus(metrics) {
        if (this.nexus && typeof this.nexus.logTrend === 'function') {
            // Note: NexusInterface.logTrend must be implemented elsewhere in the system
            await this.nexus.logTrend('metrics_snapshot', metrics);
        } else {
            console.warn("MetricNexus: Nexus logging interface not available or implemented.");
        }
    }

    /**
     * Retrieves all cached or freshly calculated metrics in a structured object,
     * and logs the results persistently before returning them.
     * @returns {Promise<Object>}
     */
    async getAllMetrics() {
        // Ensure all are calculated/updated on demand
        const metrics = {
            UFRM: this.getUFRM(),
            CFTM: this.getCFTM(),
            PVM: this.getPolicyVolatility(),
            MQM_EQM: this.getEvolutionQualityMetric() // Explicit MQM usage
        };
        
        // Asynchronously log trends to Nexus
        await this.logMetricsToNexus(metrics);

        return metrics;
    }
}

module.exports = MetricNexus;