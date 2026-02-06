/**
 * GHM: Governance Health Monitor
 * Responsible for continuously assessing the operational integrity of the OGT Core components
 * using weighted scoring and configurable thresholds, and smoothing the resultant signal.
 */

// --- Configuration Constants ---
const DEFAULT_LATENCY_THRESHOLD_MS = 500;
const MINIMUM_GRS_THRESHOLD = 0.85;

const HEALTH_DEFAULTS = Object.freeze({
    latencyThresholdMs: DEFAULT_LATENCY_THRESHOLD_MS,
    // Alpha (α) factor for Exponential Smoothing (0.0 to 1.0). Lower is smoother.
    smoothingAlpha: 0.15 
});

// Use high-resolution timing when available
const performanceMonitor = global.performance || Date;

/**
 * Helper function to calculate a normalized health score.
 * Uses a simple inverse linear model, capped at zero.
 * @param {number} latencyMs - Observed latency in milliseconds.
 * @param {number} threshold - Maximum acceptable latency.
 * @returns {number} Health Score (0.0 to 1.0).
 */
function calculateHealthScore(latencyMs, threshold) {
    if (latencyMs <= 0) return 1.0;
    if (latencyMs >= threshold) return 0.0;
    // Score based on inverse linear scale.
    return 1.0 - (latencyMs / threshold);
}

class GovernanceHealthMonitor {
    /**
     * @param {object} dependencies 
     * @param {object} dependencies.mcraEngine - Component adhering to Diagnosable interface (must expose runDiagnostics).
     * @param {object} dependencies.atmSystem - Component adhering to Diagnosable interface.
     * @param {object} dependencies.policyEngine - Component adhering to Diagnosable interface.
     * @param {object} dependencies.auditLogger - Required structured logging utility.
     * @param {object} [config={}] - Optional configuration for thresholds and weights.
     */
    constructor({ mcraEngine, atmSystem, policyEngine, auditLogger, config = {} }) {
        if (!auditLogger || typeof auditLogger.logError !== 'function') {
            throw new Error("GHM: Must provide a valid auditLogger utility.");
        }

        // Standardized component storage, ensuring only relevant dependencies are stored
        this.components = { mcraEngine, atmSystem, policyEngine };
        this.auditLogger = auditLogger;

        const componentKeys = Object.keys(this.components);

        // Configuration Handling (Merged and Frozen for immutability)
        this.healthConfig = Object.freeze({
            latencyThresholdMs: config.latencyThresholdMs || HEALTH_DEFAULTS.latencyThresholdMs,
            smoothingAlpha: config.smoothingAlpha || HEALTH_DEFAULTS.smoothingAlpha,
            // Assume default weight of 1 for all components if specific config is absent
            componentWeights: Object.freeze(componentKeys.reduce((acc, key) => 
                ({ ...acc, [key]: (config.componentWeights && config.componentWeights[key]) || 1 }), {}))
        });
        
        // Runtime State: Initialize the Governance Readiness Signal state (smoothed)
        this.smoothedGrs = 1.0; 
    }

    /**
     * Polls an individual OGT component for its status and latency.
     * @param {string} componentId - The ID of the component (e.g., 'mcraEngine').
     * @returns {Promise<{id: string, isReady: boolean, latencyMs: number, healthScore: number, weight: number}>}
     */
    async checkComponentStatus(componentId) {
        const component = this.components[componentId];
        const weight = this.healthConfig.componentWeights[componentId] || 1;
        const latencyThreshold = this.healthConfig.latencyThresholdMs;

        // 1. Check for diagnosability
        if (!component || typeof component.runDiagnostics !== 'function') {
            this.auditLogger.logWarning({
                event: 'GHM_MISSING_DIAGNOSTIC',
                message: `Component ${componentId} registered but does not expose runDiagnostics().`
            });
            // Return defined failed status instead of relying on weight/score calculation below
            return { id: componentId, isReady: false, latencyMs: -1, healthScore: 0, weight };
        }
        
        try {
            // 2. Run Diagnostic Timing
            const start = performanceMonitor.now();
            await component.runDiagnostics();
            const latencyMs = performanceMonitor.now() - start;
            
            const healthScore = calculateHealthScore(latencyMs, latencyThreshold);
            
            return {
                id: componentId,
                isReady: true,
                // Round latency for cleaner reporting while preserving high precision during measurement
                latencyMs: parseFloat(latencyMs.toFixed(2)),
                healthScore,
                weight
            };
        } catch (error) {
            // 3. Handle execution failure
            this.auditLogger.logError({
                event: 'GHM_COMPONENT_FAILURE',
                message: `Diagnostic failure for ${componentId}`,
                details: error.message || 'Unknown Error',
                componentId
            });
            return { id: componentId, isReady: false, latencyMs: -1, healthScore: 0, weight };
        }
    }

    /**
     * Aggregates the weighted health scores of all OGT components into a single GRS.
     * The result is calculated immediately and then used to update the smoothed GRS state.
     * @returns {Promise<{rawGrs: number, smoothedGrs: number, detailedStatuses: Array<object>}>} 
     * Governance Readiness Signal (GRS: 0.0 to 1.0) and status details.
     */
    async getGovernanceReadinessSignal() {
        const componentKeys = Object.keys(this.components);
        
        // Use Promise.all, relying on internal error handling in checkComponentStatus to ensure aggregation completes.
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

        const rawGrs = totalWeight > 0 ? totalWeightedScore / totalWeight : 0.0;
        
        // Apply Exponential Smoothing (EWMA) to maintain signal stability
        const alpha = this.healthConfig.smoothingAlpha;
        this.smoothedGrs = (alpha * rawGrs) + ((1 - alpha) * this.smoothedGrs);

        // Rounding results for clean output while maintaining internal float precision for the next iteration
        return { 
            rawGrs: parseFloat(rawGrs.toFixed(4)), 
            smoothedGrs: parseFloat(this.smoothedGrs.toFixed(4)), 
            detailedStatuses 
        };
    }

    /**
     * Primary interface for the GSEP protocol check in Stage 3.
     * @param {number} requiredThreshold - Minimum acceptable GRS (e.g., 0.85).
     * @returns {Promise<boolean>}
     */
    async isReady(requiredThreshold = MINIMUM_GRS_THRESHOLD) {
        // Recalculate and update the smoothed GRS state before evaluation
        const { smoothedGrs, rawGrs } = await this.getGovernanceReadinessSignal();
        
        if (smoothedGrs < requiredThreshold) {
             this.auditLogger.logWarning({
                event: 'GHM_GRS_BELOW_THRESHOLD',
                metric: 'SMOOTHED_GRS',
                currentValue: smoothedGrs.toFixed(4),
                requiredValue: requiredThreshold.toFixed(4),
                rawScore: rawGrs.toFixed(4)
             });
        }

        return smoothedGrs >= requiredThreshold;
    }
}

module.exports = GovernanceHealthMonitor;