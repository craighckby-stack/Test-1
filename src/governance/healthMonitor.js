/**
 * GHM: Governance Health Monitor
 * Responsible for continuously assessing the operational integrity of the OGT Core components
 * using weighted scoring, configurable thresholds, and signal smoothing (EWMA).
 * 
 * Sovereign AGI Refinement: Encapsulated score calculation and introduced structured reporting.
 */
const { pTimeout } = require('../utilities/asyncTimeout');
const { MINIMUM_GRS_THRESHOLD, HEALTH_DEFAULTS } = require('../config/governanceHealthConfig');

// --- Enums ---
const ComponentStatus = Object.freeze({
    OK: 'OK',
    FAILED: 'FAILED',
    UNCONFIGURED: 'UNCONFIGURED',
    TIMEOUT: 'TIMEOUT',
    // DEGRADED reserved for future predictive metrics (e.g., from Resource Monitor)
    DEGRADED: 'DEGRADED'
});

// High-resolution timing, standardizing access (using Date fallback for robustness)
const performanceMonitor = global.performance || Date;
const now = () => performanceMonitor.now();

/**
 * @typedef {object} Diagnosable
 * @property {function(): Promise<void>} runDiagnostics - Method to check component operational status.
 *
 * @typedef {object} ComponentHealthReport
 * @property {string} id - Component identifier.
 * @property {ComponentStatus} status - Operational status.
 * @property {number} weight - Contribution weight (normalized to 1.0).
 * @property {number} latencyMs - Observed operational latency.
 * @property {number} thresholdMs - Configured latency threshold used for scoring.
 * @property {number} healthScore - Calculated score (0.0 to 1.0).
 * @property {string} detail - Detailed message about the check result.
 */

class GovernanceHealthMonitor {

    /**
     * Helper function to calculate a normalized health score.
     * Uses a simple inverse linear model, capped at zero.
     * @param {number} latencyMs - Observed latency in milliseconds.
     * @param {number} threshold - Maximum acceptable latency.
     * @returns {number} Health Score (0.0 to 1.0).
     */
    static calculateHealthScore(latencyMs, threshold) {
        if (latencyMs <= 0 || latencyMs === -1) return 1.0;
        // Latency >= threshold results in score <= 0.0
        return Math.max(0.0, 1.0 - (latencyMs / threshold));
    }

    /**
     * @param {object} dependencies
     * @param {object} dependencies.auditLogger - Required structured logging utility.
     * @param {object} [config={}] - Optional configuration for thresholds and weights.
     * @param {...Diagnosable} dependencies - Remaining properties are treated as components.
     */
    constructor({ auditLogger, config = {}, ...diagnosableComponents }) {
        if (!auditLogger || typeof auditLogger.logError !== 'function') {
            throw new Error("GHM Initialization Error: Must provide a valid auditLogger utility.");
        }

        this.auditLogger = auditLogger;
        
        this.components = Object.freeze(diagnosableComponents);
        const componentKeys = Object.keys(this.components);

        const latencyThresholdMs = config.latencyThresholdMs || HEALTH_DEFAULTS.latencyThresholdMs;

        // Configuration Handling: Determine effective weights with robust fallbacks.
        const effectiveComponentWeights = componentKeys.reduce((acc, key) => {
            // Priority: User config > Default in config file > Absolute fallback (1)
            const weight = config.componentWeights?.[key] ?? HEALTH_DEFAULTS.defaultComponentWeights[key] ?? 1;
            return { ...acc, [key]: weight };
        }, {});
        
        this.healthConfig = Object.freeze({
            latencyThresholdMs,
            smoothingAlpha: config.smoothingAlpha || HEALTH_DEFAULTS.smoothingAlpha,
            componentWeights: Object.freeze(effectiveComponentWeights)
        });

        // Runtime State
        this.smoothedGrs = 1.0;
        this.lastChecked = null; // Timestamp of the last successful check
    }

    /**
     * Helper to apply Exponential Weighted Moving Average (EWMA) smoothing.
     * @param {number} rawGrs - The newly calculated raw score (0.0 to 1.0).
     * @private
     */
    _updateSmoothedGrs(rawGrs) {
        const alpha = this.healthConfig.smoothingAlpha;
        this.smoothedGrs = (alpha * rawGrs) + ((1 - alpha) * this.smoothedGrs);
    }

    /**
     * Constructs a consistent component report object structure.
     * @param {string} id 
     * @param {ComponentStatus} status 
     * @param {object} metrics 
     * @param {string} detail 
     * @returns {ComponentHealthReport}
     * @private
     */
    _createReport(id, status, metrics, detail) {
        const weight = this.healthConfig.componentWeights[id] || 1;
        const thresholdMs = this.healthConfig.latencyThresholdMs;
        const latencyMs = metrics.latencyMs !== undefined ? metrics.latencyMs : -1;
        
        // Calculate score based on inputs, defaults to 0.0 unless status is explicitly OK
        const healthScore = metrics.healthScore !== undefined 
            ? metrics.healthScore 
            : (status === ComponentStatus.OK 
                ? GovernanceHealthMonitor.calculateHealthScore(latencyMs, thresholdMs) 
                : 0.0);

        // All numeric outputs are rounded here for reporting consistency
        return {
            id,
            status,
            weight,
            latencyMs: parseFloat(latencyMs.toFixed(2)),
            thresholdMs,
            healthScore: parseFloat(healthScore.toFixed(4)),
            detail
        };
    }

    /**
     * Polls an individual OGT component for its status and latency.
     * Uses pTimeout utility to ensure operations do not hang indefinitely.
     * 
     * @param {string} componentId - The ID of the component (e.g., 'mcraEngine').
     * @returns {Promise<ComponentHealthReport>}
     */
    async checkComponentStatus(componentId) {
        const component = this.components[componentId];
        const latencyThreshold = this.healthConfig.latencyThresholdMs;

        // 1. Check for valid component/diagnosability
        if (!component || typeof component.runDiagnostics !== 'function') {
            this.auditLogger.logWarning({
                event: 'GHM_MISSING_DIAGNOSTIC',
                message: `Component ${componentId} is unconfigured or missing runDiagnostics().`,
                componentId
            });
            return this._createReport(componentId, ComponentStatus.UNCONFIGURED, { latencyMs: -1 }, `runDiagnostics() missing.`);
        }

        try {
            // 2. Run Diagnostic Timing with explicit timeout enforcement
            const start = now();
            
            await pTimeout(
                component.runDiagnostics(), 
                latencyThreshold, 
                `Diagnostic timeout (${latencyThreshold}ms)`
            );

            const latencyMs = now() - start;
            
            // 3. Success
            // Note: healthScore is calculated inside _createReport if not explicitly provided here.
            return this._createReport(
                componentId, 
                ComponentStatus.OK, 
                { latencyMs }, 
                `Latency OK`
            );

        } catch (error) {
            // 4. Handle execution failure (Timeout or Runtime Error)
            let status;
            let detail;
            const errorMetrics = {};

            if (error.code === 'ETIMEOUT') {
                status = ComponentStatus.TIMEOUT;
                detail = `Timeout exceeded: ${latencyThreshold}ms`;
                // For timeouts, latency is set to threshold to correctly calculate 0.0 score.
                errorMetrics.latencyMs = latencyThreshold;
                this.auditLogger.logWarning({
                    event: 'GHM_COMPONENT_TIMEOUT',
                    message: `Diagnostic timeout for ${componentId}`,
                    threshold: latencyThreshold,
                    componentId
                });
            } else {
                status = ComponentStatus.FAILED;
                detail = error.message || 'Unknown Runtime Error';
                this.auditLogger.logError({
                    event: 'GHM_COMPONENT_FAILURE',
                    message: `Diagnostic execution failed for ${componentId}`,
                    details: detail,
                    componentId,
                    stack: error.stack
                });
            }

            // FAILED or TIMEOUT status implies a 0.0 score.
            return this._createReport(componentId, status, errorMetrics, detail);
        }
    }

    /**
     * Aggregates the weighted health scores of all OGT components into a single GRS.
     * @returns {Promise<{rawGrs: number, smoothedGrs: number, timestamp: number, detailedStatuses: Array<ComponentHealthReport>}>}
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
        this.lastChecked = Date.now();

        // Ensure clean output rounding happens only here
        return {
            rawGrs: parseFloat(rawGrs.toFixed(4)),
            smoothedGrs: parseFloat(this.smoothedGrs.toFixed(4)),
            timestamp: this.lastChecked,
            detailedStatuses
        };
    }

    /**
     * Primary interface for the GSEP protocol check in Stage 3.
     * @param {number} requiredThreshold - Minimum acceptable GRS (defaults to global config value).
     * @returns {Promise<boolean>}
     */
    async isReady(requiredThreshold = MINIMUM_GRS_THRESHOLD) {
        // Recalculate and update the smoothed GRS state before evaluation
        const { smoothedGrs, rawGrs, detailedStatuses } = await this.getGovernanceReadinessSignal();

        const isReady = smoothedGrs >= requiredThreshold;
        
        if (!isReady) {
             const failedDetails = detailedStatuses
                .filter(d => d.status !== ComponentStatus.OK)
                .map(d => ({
                    id: d.id, 
                    status: d.status, 
                    score: d.healthScore.toFixed(4),
                    latency: d.latencyMs.toFixed(2),
                    detail: d.detail
                }));

             this.auditLogger.logWarning({
                event: 'GHM_GRS_BELOW_THRESHOLD',
                metric: 'SMOOTHED_GRS',
                currentValue: smoothedGrs.toFixed(4),
                requiredValue: requiredThreshold,
                rawScore: rawGrs.toFixed(4),
                // Log failed component summary for immediate triage
                failedComponents: failedDetails
             });
        }

        return isReady;
    }
}

GovernanceHealthMonitor.ComponentStatus = ComponentStatus;

module.exports = GovernanceHealthMonitor;