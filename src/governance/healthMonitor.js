/**
 * GHM: Governance Health Monitor
 * Responsible for continuously assessing the operational integrity of the OGT Core components
 * using weighted scoring, configurable thresholds, and signal smoothing (EWMA).
 */
const { pTimeout } = require('../utilities/asyncTimeout');

// --- Constants & Enums ---
const DEFAULT_LATENCY_THRESHOLD_MS = 500;
const MINIMUM_GRS_THRESHOLD = 0.85;

// Shared Configuration Defaults
const HEALTH_DEFAULTS = Object.freeze({
    latencyThresholdMs: DEFAULT_LATENCY_THRESHOLD_MS,
    // Alpha (α) factor for Exponential Smoothing (0.0 to 1.0). Lower is smoother/more lag.
    smoothingAlpha: 0.15
});

const ComponentStatus = Object.freeze({
    OK: 'OK',
    FAILED: 'FAILED',
    UNCONFIGURED: 'UNCONFIGURED',
    TIMEOUT: 'TIMEOUT' // Operation exceeded acceptable latency bounds (explicitly enforced via Promise timeout)
});

// High-resolution timing, standardizing access (using Date fallback for robustness)
const performanceMonitor = global.performance || Date;
const now = () => performanceMonitor.now();

/**
 * Helper function to calculate a normalized health score.
 * Uses a simple inverse linear model, capped at zero.
 * @param {number} latencyMs - Observed latency in milliseconds.
 * @param {number} threshold - Maximum acceptable latency.
 * @returns {number} Health Score (0.0 to 1.0).
 */
function calculateHealthScore(latencyMs, threshold) {
    if (latencyMs <= 0 || latencyMs === -1) return 1.0;
    // Score based on inverse linear scale. Capped at 0.
    return Math.max(0.0, 1.0 - (latencyMs / threshold));
}

class GovernanceHealthMonitor {
    /**
     * @typedef {object} Diagnosable
     * @property {function(): Promise<void>} runDiagnostics - Method to check component operational status.
     *
     * @param {object} dependencies
     * @param {Diagnosable} dependencies.mcraEngine
     * @param {Diagnosable} dependencies.atmSystem
     * @param {Diagnosable} dependencies.policyEngine
     * @param {object} dependencies.auditLogger - Required structured logging utility.
     * @param {object} [config={}] - Optional configuration for thresholds and weights.
     */
    constructor({ mcraEngine, atmSystem, policyEngine, auditLogger, config = {} }) {
        if (!auditLogger || typeof auditLogger.logError !== 'function') {
            throw new Error("GHM Initialization Error: Must provide a valid auditLogger utility.");
        }

        this.auditLogger = auditLogger;
        // Standardized component storage for easy iteration
        this.components = Object.freeze({ mcraEngine, atmSystem, policyEngine });
        const componentKeys = Object.keys(this.components);

        // Configuration Handling (Merged and Frozen for immutability)
        this.healthConfig = Object.freeze({
            latencyThresholdMs: config.latencyThresholdMs || HEALTH_DEFAULTS.latencyThresholdMs,
            smoothingAlpha: config.smoothingAlpha || HEALTH_DEFAULTS.smoothingAlpha,
            componentWeights: Object.freeze(componentKeys.reduce((acc, key) =>
                ({ ...acc, [key]: (config.componentWeights?.[key] ?? 1) }), {}))
        });

        // Runtime State: Initialize the Governance Readiness Signal state (smoothed)
        this.smoothedGrs = 1.0;
    }

    /**
     * Helper to apply Exponential Weighted Moving Average (EWMA) smoothing.
     * @param {number} rawGrs - The newly calculated raw score.
     * @private
     */
    _updateSmoothedGrs(rawGrs) {
        const alpha = this.healthConfig.smoothingAlpha;
        this.smoothedGrs = (alpha * rawGrs) + ((1 - alpha) * this.smoothedGrs);
    }

    /**
     * Polls an individual OGT component for its status and latency.
     * Uses pTimeout utility to ensure operations do not hang indefinitely.
     * 
     * @param {string} componentId - The ID of the component (e.g., 'mcraEngine').
     * @returns {Promise<{id: string, status: ComponentStatus, latencyMs: number, healthScore: number, weight: number, detail: string}>}
     */
    async checkComponentStatus(componentId) {
        const component = this.components[componentId];
        const weight = this.healthConfig.componentWeights[componentId] || 1;
        const latencyThreshold = this.healthConfig.latencyThresholdMs;

        const baseResult = {
            id: componentId,
            weight,
            latencyMs: -1,
            healthScore: 0.0, // Default to lowest score on failure/unconfigured
            detail: 'N/A'
        };

        // 1. Check for valid component/diagnosability
        if (!component || typeof component.runDiagnostics !== 'function') {
            this.auditLogger.logWarning({
                event: 'GHM_MISSING_DIAGNOSTIC',
                message: `Component ${componentId} is unconfigured or missing runDiagnostics().`,
                componentId
            });
            return { ...baseResult, status: ComponentStatus.UNCONFIGURED, detail: `runDiagnostics() missing or invalid.` };
        }

        try {
            // 2. Run Diagnostic Timing with explicit timeout enforcement
            const start = now();
            
            await pTimeout(
                component.runDiagnostics(), 
                latencyThreshold, 
                `Component diagnostic exceeded configured threshold of ${latencyThreshold}ms`
            );

            const latencyMs = now() - start;
            
            // 3. Success evaluation (Latency score calculation)
            const healthScore = calculateHealthScore(latencyMs, latencyThreshold);
            
            return {
                id: componentId,
                status: ComponentStatus.OK,
                latencyMs: parseFloat(latencyMs.toFixed(2)),
                healthScore: healthScore,
                weight,
                detail: `Latency OK (${latencyMs.toFixed(2)}ms)`
            };

        } catch (error) {
            // 4. Handle execution failure (Timeout or Runtime Error)
            let status;
            let detail;
            let latencyMs = -1; 

            if (error.code === 'ETIMEOUT') {
                status = ComponentStatus.TIMEOUT;
                detail = error.message;
                // If it timed out, record the latency as the threshold for scoring consistency
                latencyMs = latencyThreshold; 
                this.auditLogger.logWarning({
                    event: 'GHM_COMPONENT_TIMEOUT',
                    message: detail,
                    threshold: latencyThreshold,
                    componentId
                });
            } else {
                status = ComponentStatus.FAILED;
                detail = error.message || 'Unknown Execution Error';
                this.auditLogger.logError({
                    event: 'GHM_COMPONENT_FAILURE',
                    message: `Diagnostic execution failed for ${componentId}`,
                    details: detail,
                    componentId,
                    stack: error.stack
                });
            }

            // TIMEOUT and FAILED result in 0.0 health score.
            return { ...baseResult, status, detail, latencyMs, healthScore: 0.0 };
        }
    }

    /**
     * Aggregates the weighted health scores of all OGT components into a single GRS.
     * @returns {Promise<{rawGrs: number, smoothedGrs: number, detailedStatuses: Array<object>}>
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

        const rawGrs = totalWeight > 0 ? totalWeightedScore / totalWeight : 0.0;

        // Apply Exponential Smoothing (EWMA) to maintain signal stability
        this._updateSmoothedGrs(rawGrs);

        // Ensure clean output rounding only happens here
        return {
            rawGrs: parseFloat(rawGrs.toFixed(4)),
            smoothedGrs: parseFloat(this.smoothedGrs.toFixed(4)),
            detailedStatuses
        };
    }

    /**
     * Primary interface for the GSEP protocol check in Stage 3.
     * @param {number} requiredThreshold - Minimum acceptable GRS (defaults to 0.85).
     * @returns {Promise<boolean>}
     */
    async isReady(requiredThreshold = MINIMUM_GRS_THRESHOLD) {
        // Recalculate and update the smoothed GRS state before evaluation
        const { smoothedGrs, rawGrs, detailedStatuses } = await this.getGovernanceReadinessSignal();

        if (smoothedGrs < requiredThreshold) {
             this.auditLogger.logWarning({
                event: 'GHM_GRS_BELOW_THRESHOLD',
                metric: 'SMOOTHED_GRS',
                currentValue: smoothedGrs,
                requiredValue: requiredThreshold,
                rawScore: rawGrs,
                // Provide failed components for immediate triage
                failedComponents: detailedStatuses.filter(d => d.status !== ComponentStatus.OK).map(d => ({id: d.id, status: d.status, score: d.healthScore}))
             });
        }

        return smoothedGrs >= requiredThreshold;
    }
}

GovernanceHealthMonitor.ComponentStatus = ComponentStatus;

module.exports = GovernanceHealthMonitor;