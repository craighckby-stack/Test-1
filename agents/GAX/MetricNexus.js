/**
 * MetricNexus (MN):
 * Centralized dynamic metric management system, now explicitly integrated with the Nexus-Database 
 * for persistent trend storage, fulfilling the CRITICAL DIRECTIVE: Integration Before Expansion.
 * 
 * Fulfills Requirements:
 * - Use MQM metrics to measure actual improvement (via EQM).
 * - Store trends in Nexus memory (via logMetricsToNexus).
 * - Use Nexus memory to inform strategy (via getHistoricalTrends).
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
        this.nexus = NexusInterface || {}; 
        this.metricCache = {};
        
        // Integration Requirement Validation: Crucial for Cycles 6-15.
        this.isNexusIntegrationActive = 
            typeof this.nexus.logTrend === 'function' &&
            typeof this.nexus.readTrends === 'function';

        if (!this.isNexusIntegrationActive) {
            // Log a warning if the Nexus dependency required for the CRITICAL DIRECTIVE is incomplete.
            console.warn("MetricNexus [CRITICAL DIRECTIVE FAILURE]: NexusInterface lacks required methods (logTrend, readTrends). Persistence and historical strategy retrieval (Req 2 & 3) are inactive.");
        }
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
     * Calculates the Evolution Quality Metric (EQM), the primary MQM indicator.
     * EQM is a weighted fusion of risk and trend metrics, crucial for autonomous self-assessment.
     * @returns {number} (0-100 quality scale)
     */
    getEvolutionQualityMetric() {
        const ufrm = this.getUFRM();
        const cftm = this.getCFTM();
        const pvm = this.getPolicyVolatility();
        
        // Applying the MQM formula based on risk factors (assuming inputs are 0.0 to 1.0, where 1.0 is high risk).
        // Risk Score is normalized combination of Unknown Factors, Flux Trends, and Policy Volatility.
        const riskScore = (ufrm * 0.4) + (cftm * 0.3) + (pvm * 0.3); 
        
        // Normalize the metric to fit a 0-100 quality scale (100 being lowest risk/highest quality).
        const eqm = Math.max(0, 100 - riskScore * 100); 

        const sanitizedEqm = this._sanitizeMetric(eqm);
        
        this.metricCache.EQM = sanitizedEqm;
        return sanitizedEqm;
    }

    /**
     * Calculates and returns the Unknown Factor Risk Metric (UFRM).
     * @returns {number} (Risk Factor, typically 0.0 to 1.0)
     */
    getUFRM() {
        // Use optional chaining for safe access to external dependencies
        const rawUfrm = this.analytics?.calculateResidualRisk?.() ?? 0;
        const ufrm = this._sanitizeMetric(rawUfrm);
        this.metricCache.UFRM = ufrm;
        return ufrm;
    }

    /**
     * Calculates and returns the Contextual Flux Trend Metric (CFTM).
     * @returns {number} (Volatility Factor, typically 0.0 to 1.0)
     */
    getCFTM() {
        const rawCftm = this.analytics?.getHistoricalVolatilityFactor?.() ?? 0;
        const cftm = this._sanitizeMetric(rawCftm);
        this.metricCache.CFTM = cftm;
        return cftm;
    }

    /**
     * Calculates and returns the Policy Volatility Metric (PVM).
     * @returns {number} (Change Rate Factor, typically 0.0 to 1.0)
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
     * Uses internal error handling pattern for resilience.
     * @param {Object} metrics - The calculated metric snapshot.
     */
    async logMetricsToNexus(metrics) {
        if (!this.isNexusIntegrationActive) {
            // Nexus persistence is intentionally skipped if the interface failed validation.
            return; 
        }
        try {
            // Log under a specific key for easy retrieval later
            await this.nexus.logTrend('metrics_snapshot', { 
                timestamp: Date.now(), 
                ...metrics 
            });
        } catch (error) {
            // Use existing error handling pattern: log the fault but do not halt the evolution.
            console.error(`MetricNexus Persistence Failure: Failed to log trends to Nexus. Error: ${error.message}`);
        }
    }

    /**
     * [Integration] Reads historical metric trends from Nexus.
     * Fulfills Integration Requirement: Use Nexus memory to inform strategy (Req 3).
     * Uses internal error handling pattern for resilience.
     * @param {number} limit - Number of history entries to retrieve.
     * @returns {Promise<Array<Object>>}
     */
    async getHistoricalTrends(limit = 10) {
        if (!this.isNexusIntegrationActive) {
            return [];
        }
        try {
            return await this.nexus.readTrends('metrics_snapshot', limit);
        } catch (error) {
            // Use existing error handling pattern: log the fault and return safe empty array.
            console.error(`MetricNexus Retrieval Failure: Failed to retrieve historical trends from Nexus. Error: ${error.message}`);
            return [];
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
        
        // Log trends (Integration Requirement 2)
        await this.logMetricsToNexus(metrics);

        return metrics;
    }
}

module.exports = MetricNexus;