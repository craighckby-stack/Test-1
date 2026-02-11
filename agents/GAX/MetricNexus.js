/**
 * MetricNexus (MN):
 * Centralized dynamic metric management system, now explicitly integrated with the Nexus-Database 
 * for persistent trend storage, fulfilling the CRITICAL DIRECTIVE: Integration Before Expansion.
 *
 * This module provides the Monitoring Quality Metric (MQM) calculations necessary 
 * for autonomous self-assessment (Integration Requirement 2).
 * 
 * NOTE: Core calculation logic (EQM, UFRM, CFTM, PVM) has been delegated to the
 * 'MetricCalculatorService' via KERNEL_SYNERGY_CAPABILITIES for performance and modularity.
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
 */

const METRIC_CONSTANTS = {
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
     * Internal helper to execute methods on the MetricCalculatorService, 
     * ensuring robust capability checks.
     * @param {string} method - The method name on MetricCalculatorService.
     * @param {Object} args - Arguments passed to the method.
     * @returns {Promise<number>} The calculated or sanitized metric value, or 0 on failure.
     */
    async _executeMetricTool(method, args) {
        if (typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' && KERNEL_SYNERGY_CAPABILITIES.MetricCalculatorService) {
            const service = KERNEL_SYNERGY_CAPABILITIES.MetricCalculatorService;
            
            if (typeof service[method] === 'function') {
                return await service[method](args);
            } else {
                console.error(`[MN ERROR]: MetricCalculatorService exists but missing required method: ${method}`);
                return 0; // Return safe default
            }
        } else {
            console.error("[MN CRITICAL ERROR]: MetricCalculatorService is not available in KERNEL_SYNERGY_CAPABILITIES. Metrics calculations bypassed.");
            return 0; // Return safe default
        }
    }

    /**
     * Calculates the Evolution Quality Metric (EQM), the primary MQM indicator.
     * Delegates computation and sanitization to the MetricCalculator tool.
     * Fulfills Integration Requirement 2 (Use MQM metrics).
     * @returns {Promise<number>} (0-100 quality scale)
     */
    async getEvolutionQualityMetric() {
        
        // 1. Gather raw inputs from external dependencies
        const rawUfrm = this.analytics.calculateResidualRisk?.() ?? 0;
        const rawCftm = this.analytics.getHistoricalVolatilityFactor?.() ?? 0;
        const rawPvm = this.auditor.calculatePolicyChangeRate?.() ?? 0;

        // 2. Use the Tool to calculate and sanitize metric components
        const ufrm = await this._executeMetricTool('calculateUFRM', { rawRisk: rawUfrm });
        const cftm = await this._executeMetricTool('calculateCFTM', { rawVolatility: rawCftm });
        const pvm = await this._executeMetricTool('calculatePVM', { rawPolicyChangeRate: rawPvm });
        
        // 3. Use the Tool to calculate the final EQM score
        // Note: EQM calculation uses named arguments for clarity
        const sanitizedEqm = await this._executeMetricTool('calculateEQM', { ufrm, cftm, pvm });
        
        // Cache the results
        this.metricCache.UFRM = ufrm;
        this.metricCache.CFTM = cftm;
        this.metricCache.PVM = pvm;
        this.metricCache.EQM = sanitizedEqm;

        return sanitizedEqm;
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

        // Helper to normalize values using the mandated MetricCalculator proxy (calculateUFRM).
        // This pattern uses a consistent service method to sanitize/normalize all metric values.
        const normalize = (value) => this._executeMetricTool('calculateUFRM', { rawRisk: value });

        const currentEQM = await normalize(currentMetrics.MQM_EQM);
        const previousEQM = await normalize(previousMetrics.MQM_EQM);
        
        const rawDelta = currentEQM - previousEQM;

        return {
            // Sanitize and normalize the final delta value
            delta: await normalize(rawDelta),
            previousEQM: previousEQM
        };
    }
}

export default MetricNexus;