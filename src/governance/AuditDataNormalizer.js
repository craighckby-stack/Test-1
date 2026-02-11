/**
 * src/governance/AuditDataNormalizer.js
 * Purpose: Processes raw system telemetry and audit logs, transforming them into the
 * normalized metrics [0.0, 1.0] required by the PerformanceMetricGenerator.
 * This layer handles logic such as converting latency spikes or resource usage percentages
 * into the required 'efficiencyScore', and aggregating log events into compliance ratios.
 */

// Placeholder utility function representing the LinearScoreNormalizer plugin's core logic.
// In a real environment, this function would be imported.
const normalizeLinearScore = (rawValue, goodThreshold, badThreshold) => {
    if (rawValue <= goodThreshold) {
        return 1.0;
    }
    if (rawValue >= badThreshold) {
        return 0.0;
    }

    // Linear interpolation between the good and bad thresholds
    const range = badThreshold - goodThreshold;
    const score = 1.0 - (rawValue - goodThreshold) / range;
    
    return Math.max(0.0, Math.min(1.0, score));
};

class AuditDataNormalizer {

    /**
     * Standard configuration thresholds for metric conversion.
     */
    static DEFAULT_THRESHOLDS = {
        P95_LATENCY_GOOD_MS: 50, // Optimal latency threshold
        P95_LATENCY_BAD_MS: 500, // Latency score drops to 0.0 above this threshold
        RESOURCE_USAGE_MAX_PCT: 85, // Resource usage must stay below this for 1.0 score
        COMPLIANCE_WINDOW_MS: 3600000 // 1 hour window for compliance ratio calculation
    };

    /**
     * @param {Object} config - Optional threshold overrides.
     */
    constructor(config = {}) {
        this.thresholds = { ...AuditDataNormalizer.DEFAULT_THRESHOLDS, ...config };
    }

    /**
     * Normalizes all collected raw data into the format required by the metric generator.
     * 
     * @param {string} actorId - ID of the component.
     * @param {Object} rawTelemetry - Raw, recent telemetry and event logs.
     * @param {number} rawTelemetry.p95LatencyMs - Observed 95th percentile latency.
     * @param {number} rawTelemetry.complianceChecksRun - Total policy checks executed.
     * @param {number} rawTelemetry.complianceChecksFailed - Total policy checks failed.
     * @param {number} rawTelemetry.seriousViolations - Count of non-recoverable, severe policy breaches.
     * @returns {Object} Normalized Audit Data (complianceScore, violationCount, efficiencyScore).
     */
    normalize(actorId, rawTelemetry) {
        const { 
            p95LatencyMs = Infinity,
            complianceChecksRun = 0,
            complianceChecksFailed = 0,
            seriousViolations = 0 
        } = rawTelemetry;

        const { P95_LATENCY_GOOD_MS, P95_LATENCY_BAD_MS } = this.thresholds;

        // 1. Calculate Compliance Score (Ratio of successful checks)
        let complianceScore = 1.0;
        if (complianceChecksRun > 0) {
            const successChecks = complianceChecksRun - complianceChecksFailed;
            complianceScore = successChecks / complianceChecksRun;
        }

        // 2. Calculate Efficiency Score using abstracted normalization logic
        const efficiencyScore = normalizeLinearScore(
            p95LatencyMs,
            P95_LATENCY_GOOD_MS,
            P95_LATENCY_BAD_MS
        );

        return {
            complianceScore,
            violationCount: seriousViolations,
            efficiencyScore
        };
    }
}

module.exports = AuditDataNormalizer;