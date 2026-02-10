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
 * Dependencies MUST Implement the following Interfaces:
 * 
 * Interface: AnalyticsStore
 *  - calculateResidualRisk(): number (0.0 to 1.0)
 *  - getHistoricalVolatilityFactor(): number (0.0 to 1.0)
 * 
 * Interface: PolicyAuditor
 *  - calculatePolicyChangeRate(): number (0.0 to 1.0)
 * 
 * Interface: NexusInterface (The Nexus client for persistent memory)
 *  - logTrend(key: string, data: Object): Promise<void>
 *  - readTrends(key: string, limit: number): Promise<Array<Object>>
 * 
 * Utilized Plugins:
 * - NumericSanitizer: Ensures metric values are robust and finite.
 */

// Note: NumericSanitizer is assumed to be available (e.g., imported or globally scoped) after plugin extraction.

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
        // Ensure dependencies are robustly handled, defaulting to objects to prevent runtime errors
        this.analytics = AnalyticsStore || {};
        this.auditor = PolicyAuditor || {};
        this.nexus = NexusInterface || {}; 
        this.metricCache = {};
        
        // Integration Requirement Validation 3 & 4 (Nexus Persistence).
        this.isNexusIntegrationActive = 
            typeof this.nexus.logTrend === 'function' &&
            typeof this.nexus.readTrends === 'function';

        if (!this.isNexusIntegrationActive) {
            console.warn(`[MN CRITICAL WARNING]: NexusInterface persistence required by Cycles 6-15 is inactive. Missing required methods: logTrend or readTrends.`);
        }
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
        // Cap riskScore at 1.0 before normalization.
        const eqm = Math.max(0, 100 - Math.min(1.0, riskScore) * 100); 

        const sanitizedEqm = NumericSanitizer.sanitize(eqm);
        
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
        const ufrm = NumericSanitizer.sanitize(rawUfrm);
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
        const cftm = NumericSanitizer.sanitize(rawCftm);
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
        const pvm = NumericSanitizer.sanitize(rawPvm);
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
            // Not enough history to calculate a delta.
            return { delta: 0, previousEQM: null }; 
        }

        const currentMetrics = historicalTrends[0];
        const previousMetrics = historicalTrends[1];

        // Use plugin to ensure comparison values are robust
        const currentEQM = NumericSanitizer.sanitize(currentMetrics.MQM_EQM);
        const previousEQM = NumericSanitizer.sanitize(previousMetrics.MQM_EQM);
        
        const delta = currentEQM - previousEQM;

        return {
            delta: NumericSanitizer.sanitize(delta),
            previousEQM: previousEQM
        };
    }
}

export default MetricNexus;