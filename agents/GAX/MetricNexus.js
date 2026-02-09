/**
 * MetricNexus (MN):
 * Centralized dynamic metric management system, now explicitly integrated with the Nexus-Database 
 * for persistent trend storage, fulfilling the CRITICAL DIRECTIVE: Integration Before Expansion.
 * 
 * Dependencies MUST implement:
 * - AnalyticsStore: calculateResidualRisk(), getHistoricalVolatilityFactor()
 * - PolicyAuditor: calculatePolicyChangeRate()
 * - NexusInterface: logTrend(key, data), readTrends(key, limit)
 */
class MetricNexus {
    // Inject NexusInterface for persistent storage and strategic retrieval (Integration Requirement 2 & 3)
    constructor(AnalyticsStore, PolicyAuditor, NexusInterface) {
        this.analytics = AnalyticsStore;
        this.auditor = PolicyAuditor;
        this.nexus = NexusInterface;
        this.metricCache = {};
    }

    /**
     * Internal validator to ensure metrics are valid numbers (robustness improvement).
     * @param {*} value 
     * @returns {number}
     */
    _sanitizeMetric(value) {
        const sanitized = parseFloat(value);
        // Returns 0 if NaN, ensuring numerical stability for MQM calculation.
        return isNaN(sanitized) ? 0 : sanitized;
    }

    /**
     * Placeholder function for kernel capability metrics (MQM Alignment).
     * This serves as the primary Quantitative Indicator.
     * @returns {number}
     */
    getEvolutionQualityMetric() {
        const ufrm = this.getUFRM();
        const cftm = this.getCFTM();
        const pvm = this.getPolicyVolatility();
        
        // Logic leveraging MQM philosophy.
        const eqm = (ufrm * 0.4) + (cftm * 0.3) + (pvm * 0.3); 
        const sanitizedEqm = this._sanitizeMetric(eqm);
        
        this.metricCache.EQM = sanitizedEqm;
        return sanitizedEqm;
    }

    /**
     * Calculates and returns the Unknown Factor Risk Metric (UFRM).
     * @returns {number}
     */
    getUFRM() {
        // Logic leveraging AnalyticsStore to calculate residual variance or unknown state space
        // Defensive check added: If AnalyticsStore or method is missing, returns 0.
        const rawUfrm = this.analytics?.calculateResidualRisk?.() ?? 0;
        const ufrm = this._sanitizeMetric(rawUfrm);
        this.metricCache.UFRM = ufrm;
        return ufrm;
    }

    /**
     * Calculates and returns the Contextual Flux Trend Metric (CFTM).
     * @returns {number}
     */
    getCFTM() {
        // Logic leveraging real-time telemetry on system volatility
        const rawCftm = this.analytics?.getHistoricalVolatilityFactor?.() ?? 0;
        const cftm = this._sanitizeMetric(rawCftm);
        this.metricCache.CFTM = cftm;
        return cftm;
    }

    /**
     * Calculates and returns the Policy Volatility Metric (PVM).
     * Used by PSR's projection handler.
     * @returns {number}
     */
    getPolicyVolatility() {
        const rawPvm = this.auditor?.calculatePolicyChangeRate?.() ?? 0;
        const pvm = this._sanitizeMetric(rawPvm);
        this.metricCache.PVM = pvm;
        return pvm;
    }

    /**
     * [Integration] Logs the current metric snapshot and trends to the Nexus persistent storage.
     * Fulfills Integration Requirement: Store trends in Nexus memory (Req 2).
     * @param {Object} metrics - The calculated metric snapshot.
     */
    async logMetricsToNexus(metrics) {
        if (this.nexus && typeof this.nexus.logTrend === 'function') {
            await this.nexus.logTrend('metrics_snapshot', { 
                timestamp: Date.now(), 
                ...metrics 
            });
        } else {
            // Updated warning to include CRITICAL DIRECTIVE context
            console.warn("MetricNexus [CRITICAL DIRECTIVE Failure]: Nexus logging interface not available or implemented.");
        }
    }

    /**
     * [Integration] Reads historical metric trends from Nexus.
     * Fulfills Integration Requirement: Use Nexus memory to inform strategy (Req 3).
     * @param {number} limit - Number of history entries to retrieve.
     * @returns {Promise<Array<Object>>}
     */
    async getHistoricalTrends(limit = 10) {
        if (this.nexus && typeof this.nexus.readTrends === 'function') {
            return this.nexus.readTrends('metrics_snapshot', limit);
        }
        // Return empty array if Nexus interface is missing, preventing system crash.
        return [];
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
        
        // Log trends (Integration Requirement 2)
        await this.logMetricsToNexus(metrics);

        return metrics;
    }
}

module.exports = MetricNexus;