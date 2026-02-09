/**
 * MetricNexus (MN):
 * Centralized dynamic metric management system, now explicitly integrated with the Nexus-Database 
 * for persistent trend storage, fulfilling the CRITICAL DIRECTIVE: Integration Before Expansion.
 * 
 * This module provides the Monitoring Quality Metric (MQM) calculations necessary 
 * for autonomous self-assessment (Integration Requirement 2).
 * 
 * Fulfills Requirements:
 * 2. Use MQM metrics to measure actual improvement (via EQM and ImprovementDelta).
 * 3. Store trends in Nexus memory (via logMetricsToNexus).
 * 4. Use Nexus memory to inform strategy (via getHistoricalTrends).
 * 
 * Dependencies MUST implement:
 * - AnalyticsStore: calculateResidualRisk(), getHistoricalVolatilityFactor()
 * - PolicyAuditor: calculatePolicyChangeRate()
 * - NexusInterface: logTrend(key, data), readTrends(key, limit)
 */

const METRIC_CONSTANTS = {
    // Weights for Evolution Quality Metric (EQM) calculation (must sum to 1.0)
    WEIGHT_UFRM: 0.4,
    WEIGHT_CFTM: 0.3,
    WEIGHT_PVM: 0.3,
    // Key used for Nexus persistent storage
    NEXUS_TREND_KEY: 'metrics_snapshot'
};

class MetricNexus {
    // Inject NexusInterface, AnalyticsStore, and PolicyAuditor.
    constructor(AnalyticsStore, PolicyAuditor, NexusInterface) {
        // Ensure dependencies are robustly handled, defaulting to empty objects if null/undefined
        this.analytics = AnalyticsStore || {};
        this.auditor = PolicyAuditor || {};
        this.nexus = NexusInterface || {}; 
        this.metricCache = {};
        
        // Integration Requirement Validation 3 & 4 (Nexus Persistence).
        this.isNexusIntegrationActive = 
            typeof this.nexus.logTrend === 'function' &&
            typeof this.nexus.readTrends === 'function';

        if (!this.isNexusIntegrationActive) {
            console.warn("[MN CRITICAL WARNING]: NexusInterface persistence required by Cycles 6-15 is inactive. Metrics will not be stored/retrieved historically.");
        }
    }

    /**
     * Internal validator to ensure metrics are valid numbers (robustness improvement).
     * @param {*} value 
     * @returns {number}
     */
    _sanitizeMetric(value) {
        const sanitized = parseFloat(value);
        // Returns 0 if NaN or Infinity, ensuring numerical stability for MQM calculation.
        if (isNaN(sanitized) || !isFinite(sanitized)) {
            return 0;
        }
        return sanitized;
    }

    /**
     * Calculates the Evolution Quality Metric (EQM), the primary MQM indicator.
     * EQM is a weighted fusion of risk and trend metrics, crucial for autonomous self-assessment.
     * Fulfills Integration Requirement 2 (Use MQM metrics).
     * @returns {number} (0-100 quality scale)
     */
    getEvolutionQualityMetric() {
        
        const ufrm = this.getUFRM();
        const cftm = this.getCFTM();
        const pvm = this.getPolicyVolatility();
        
        // Applying the MQM formula based on risk factors (inputs are 0.0 to 1.0, where 1.0 is high risk).
        const riskScore = 
            (ufrm * METRIC_CONSTANTS.WEIGHT_UFRM) + 
            (cftm * METRIC_CONSTANTS.WEIGHT_CFTM) + 
            (pvm * METRIC_CONSTANTS.WEIGHT_PVM); 
        
        // Normalize the metric to fit a 0-100 quality scale (100 being lowest risk/highest quality).
        // Ensure riskScore is capped at 1.0 before calculation.
        const eqm = Math.max(0, 100 - Math.min(1.0, riskScore) * 100); 

        const sanitizedEqm = this._sanitizeMetric(eqm);
        
        this.metricCache.EQM = sanitizedEqm;
        return sanitizedEqm;
    }

    /**
     * Calculates and returns the Unknown Factor Risk Metric (UFRM).
     * Measures complexity and unverified/residual risks.
     * @returns {number} (Risk Factor, typically 0.0 to 1.0)
     */
    getUFRM() {
        // Use dependency fallback pattern: if missing, return 0 risk.
        const rawUfrm = this.analytics.calculateResidualRisk?.() ?? 0;
        const ufrm = this._sanitizeMetric(rawUfrm);
        this.metricCache.UFRM = ufrm;
        return ufrm;
    }

    /**
     * Calculates and returns the Contextual Flux Trend Metric (CFTM).
     * Measures volatility of external context or rapid change in repository patterns.
     * @returns {number} (Volatility Factor, typically 0.0 to 1.0)
     */
    getCFTM() {
        const rawCftm = this.analytics.getHistoricalVolatilityFactor?.() ?? 0;
        const cftm = this._sanitizeMetric(rawCftm);
        this.metricCache.CFTM = cftm;
        return cftm;
    }

    /**
     * Calculates and returns the Policy Volatility Metric (PVM).
     * Measures the rate of change in governance or structural directives.
     * @returns {number} (Change Rate Factor, typically 0.0 to 1.0)
     */
    getPolicyVolatility() {
        const rawPvm = this.auditor.calculatePolicyChangeRate?.() ?? 0;
        const pvm = this._sanitizeMetric(rawPvm);
        this.metricCache.PVM = pvm;
        return pvm;
    }

    /**
     * [Integration] Logs the current metric snapshot and trends to the Nexus persistent storage.
     * Fulfills Integration Requirement 3: Store trends in Nexus memory.
     * @param {Object} metrics - The calculated metric snapshot.
     */
    async logMetricsToNexus(metrics) {
        if (!this.isNexusIntegrationActive) {
            // Nexus persistence is intentionally skipped if the interface failed validation.
            return; 
        }
        try {
            // Log under a specific key for easy retrieval later
            await this.nexus.logTrend(METRIC_CONSTANTS.NEXUS_TREND_KEY, { 
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
     * Fulfills Integration Requirement 4: Use Nexus memory to inform strategy.
     * @param {number} limit - Number of history entries to retrieve.
     * @returns {Promise<Array<Object>>}
     */
    async getHistoricalTrends(limit = 10) {
        if (!this.isNexusIntegrationActive) {
            return [];
        }
        try {
            return await this.nexus.readTrends(METRIC_CONSTANTS.NEXUS_TREND_KEY, limit);
        } catch (error) {
            // Use existing error handling pattern: log the fault and return safe empty array.
            console.error(`MetricNexus Retrieval Failure: Failed to retrieve historical trends from Nexus. Error: ${error.message}`);
            return [];
        }
    }

    /**
     * Calculates the improvement delta in MQM_EQM compared to the previously logged cycle.
     * Fulfills Integration Requirement 2 (Measure actual improvement).
     * NOTE: This should be called AFTER getAllMetrics logs the current state.
     * @returns {Promise<{delta: number, previousEQM: number|null}>}
     */
    async calculateImprovementDelta() {
        // Retrieve the last two cycles (Current [0] and Previous [1]).
        const historicalTrends = await this.getHistoricalTrends(2); 

        if (historicalTrends.length < 2) {
            return { delta: 0, previousEQM: null }; 
        }

        const currentMetrics = historicalTrends[0];
        const previousMetrics = historicalTrends[1];

        const currentEQM = this._sanitizeMetric(currentMetrics.MQM_EQM);
        const previousEQM = this._sanitizeMetric(previousMetrics.MQM_EQM);
        
        const delta = currentEQM - previousEQM;

        this.metricCache.MQM_Delta = delta;
        
        return { 
            delta: delta, 
            previousEQM: previousEQM 
        };
    }

    /**
     * Retrieves all cached or freshly calculated metrics in a structured object,
     * and logs the results persistently before returning them.
     * @returns {Promise<Object>} Returns metrics including MQM_Delta.
     */
    async getAllMetrics() {
        // 1. Calculate components
        const ufrm = this.getUFRM();
        const cftm = this.getCFTM();
        const pvm = this.getPolicyVolatility();
        const mqmEqm = this.getEvolutionQualityMetric(); // Calculate EQM last

        const metrics = {
            UFRM: ufrm,
            CFTM: cftm,
            PVM: pvm,
            MQM_EQM: mqmEqm // Explicit MQM usage
        };
        
        // 2. Log trends (Integration Requirement 3)
        await this.logMetricsToNexus(metrics);

        // 3. Calculate Improvement Delta (Integration Requirement 2)
        const { delta, previousEQM } = await this.calculateImprovementDelta();

        return { 
            ...metrics, 
            MQM_Delta: delta, 
            Previous_EQM: previousEQM 
        };
    }
}

module.exports = MetricNexus;