/**
 * GHM: Governance Health Monitor
 * Responsible for continuously assessing the operational integrity of the OGT Core components
 * using weighted scoring and configurable thresholds.
 */

const DEFAULT_LATENCY_THRESHOLD_MS = 500;
const MINIMUM_GRS_THRESHOLD = 0.85;

// Use high-resolution timing when available
const performanceMonitor = global.performance || Date;

class GovernanceHealthMonitor {
    /**
     * @param {object} components - OGT Core components (mcraEngine, atmSystem, etc.)
     * @param {object} components.auditLogger - Required logging utility.
     * @param {object} [config={}] - Optional configuration for thresholds and weights.
     */
    constructor({ mcraEngine, atmSystem, policyEngine, auditLogger, config = {} }) {
        if (!auditLogger || typeof auditLogger.logError !== 'function') {
            throw new Error("GHM: Must provide a valid auditLogger utility.");
        }

        // Standardized component storage, ensuring all are captured
        this.components = { mcraEngine, atmSystem, policyEngine, auditLogger };
        this.auditLogger = auditLogger;

        // Internal Configuration Handling
        const componentKeys = Object.keys(this.components);
        this.healthConfig = {
            latencyThresholdMs: config.latencyThresholdMs || DEFAULT_LATENCY_THRESHOLD_MS,
            // Assume default weight of 1 for all components if specific config is absent
            componentWeights: config.componentWeights || 
                componentKeys.reduce((acc, key) => ({ ...acc, [key]: 1 }), {})
        };
    }

    /**
     * Calculates a normalized health score based on observed latency and configured thresholds.
     * @param {number} latencyMs - Observed latency in milliseconds.
     * @param {number} threshold - Maximum acceptable latency.
     * @returns {number} Health Score (0.0 to 1.0).
     */
    _calculateHealthScore(latencyMs, threshold) {
        // Score based on inverse linear scale. Capped at 0.
        let score = 1.0 - (latencyMs / threshold);
        return Math.max(0, score);
    }

    /**
     * Polls an individual OGT component for its status and latency.
     * Assumes component classes expose an async `runDiagnostics()` method.
     * @param {string} componentId - The ID of the component (e.g., 'mcraEngine').
     * @returns {Promise<{id: string, isReady: boolean, latencyMs: number, healthScore: number, weight: number}>}
     */
    async checkComponentStatus(componentId) {
        const component = this.components[componentId];
        const weight = this.healthConfig.componentWeights[componentId] || 1;
        const latencyThreshold = this.healthConfig.latencyThresholdMs;

        if (!component || typeof component.runDiagnostics !== 'function') {
            this.auditLogger.logWarning({
                event: 'GHM_MISSING_DIAGNOSTIC',
                message: `Component ${componentId} is registered but non-diagnosable.`
            });
            return { id: componentId, isReady: false, latencyMs: -1, healthScore: 0, weight };
        }
        
        try {
            const start = performanceMonitor.now();
            await component.runDiagnostics();
            const latencyMs = performanceMonitor.now() - start;
            
            const healthScore = this._calculateHealthScore(latencyMs, latencyThreshold);
            
            return {
                id: componentId,
                isReady: true,
                latencyMs: Math.round(latencyMs * 100) / 100, // High-resolution latency rounded
                healthScore,
                weight
            };
        } catch (error) {
            // Use injected audit logger for structured failure reporting
            this.auditLogger.logError({
                event: 'GHM_COMPONENT_FAILURE',
                message: `Diagnostic failure for ${componentId}`, 
                details: error.message || String(error),
                componentId
            });
            return { id: componentId, isReady: false, latencyMs: -1, healthScore: 0, weight };
        }
    }

    /**
     * Aggregates the weighted health scores of all OGT components into a single GRS.
     * @returns {Promise<{grs: number, detailedStatuses: Array<object>}>} 
     * Governance Readiness Signal (GRS: 0.0 to 1.0) and status details.
     */
    async getGovernanceReadinessSignal() {
        const componentKeys = Object.keys(this.components);
        const detailedStatuses = await Promise.all(
            componentKeys.map(key => this.checkComponentStatus(key))
        );

        let totalWeightedScore = 0;
        let totalWeight = 0;

        detailedStatuses.forEach(status => {
            const effectiveWeight = status.weight;
            totalWeightedScore += status.healthScore * effectiveWeight;
            totalWeight += effectiveWeight;
        });

        // GRS is the weighted average score
        const grs = totalWeight > 0 ? totalWeightedScore / totalWeight : 0.0;
        
        return { grs, detailedStatuses };
    }

    /**
     * Primary interface for the GSEP protocol check in Stage 3.
     * @param {number} requiredThreshold - Minimum acceptable GRS (e.g., 0.85).
     * @returns {Promise<boolean>}
     */
    async isReady(requiredThreshold = MINIMUM_GRS_THRESHOLD) {
        const { grs } = await this.getGovernanceReadinessSignal();
        
        if (grs < requiredThreshold) {
             this.auditLogger.logWarning({
                event: 'GHM_GRS_BELOW_THRESHOLD',
                message: `GRS (${grs.toFixed(3)}) is below required minimum (${requiredThreshold.toFixed(3)}).`
             });
        }

        return grs >= requiredThreshold;
    }
}

module.exports = GovernanceHealthMonitor;