// CRM (Contextual Runtime Monitor) v2.0
// GSEP Alignment: Stage 3 (P-01 Adjudication Input S-02)
// Function: Provides high-frequency, non-blocking telemetry stream for external and environment constraints.

const ExponentialMovingAverager = require('../utils/ExponentialMovingAverager');

class ContextualRuntimeMonitor {
    static NAME = 'CRM_v94.1';
    static GSEP_ALIGNMENT = 'Stage 3 (P-01 Adjudication Input S-02)';

    /**
     * @param {Object} telemetrySourceConfig - Configuration including latencyAlpha.
     */
    constructor(telemetrySourceConfig = {}) {
        this.config = {
            latencyAlpha: 0.1, // Smoothing factor for EMA (0.0 < alpha < 1.0)
            criticalLatencyThreshold_ms: 40,
            stressRiskWeight: 0.4,
            ...telemetrySourceConfig
        };

        // Initialize EMA for O(1) continuous, high-speed latency tracking
        this.latencyEMA = new ExponentialMovingAverager(this.config.latencyAlpha);
        
        // Internal cached metrics (updated via updateMetrics)
        this.currentMetrics = {
            timestamp: null,
            latencyMean_ms: 0,
            stressIndex: 0,
            telemetryReliability: 1.0 
        };
    }

    /**
     * Fetches raw inputs (O(1) operations) and updates the internal EMA state.
     * This should be called on a dedicated high-frequency monitoring tick.
     */
    async updateMetrics() {
        const rawLatency = this._fetchCriticalLatency();
        const rawStressIndex = this._calculateExternalStress();

        // Update Latency EMA
        this.currentMetrics.latencyMean_ms = this.latencyEMA.update(rawLatency);

        // Update other metrics
        this.currentMetrics.stressIndex = parseFloat(rawStressIndex);
        this.currentMetrics.timestamp = Date.now();
    }

    /**
     * Retrieves the last calculated set of environmental metrics.
     * @returns {Object} currentMetrics 
     */
    getRealtimeMetrics() {
        return { ...this.currentMetrics }; // Return defensive copy
    }

    // --- Private Simulators/Fetchers ---

    _fetchCriticalLatency() {
        // Implement low-level, high-speed pings or buffer checks
        return Math.floor(Math.random() * 50) + 5; // Placeholder
    }

    _calculateExternalStress() {
        // Logic to interpret external saturation
        return Math.random().toFixed(2);
    }
    
    // --- Risk Calculation ---

    /**
     * Called by C-11 (MCRA Engine) to calculate environmental impact on Risk Floor (S-02).
     * Requires prior invocation of updateMetrics().
     * @returns {number} Environmental risk coefficient (0.0 to ~1.0).
     */
    calculateEnvironmentalRiskFactor() {
        const { latencyMean_ms, stressIndex } = this.currentMetrics;
        const config = this.config;

        // Latency Risk: Scaled based on deviation from the configured threshold.
        let latencyRisk = 0.05; // Baseline risk
        if (latencyMean_ms > config.criticalLatencyThreshold_ms) {
            // Exponentially scale risk above the critical threshold
            const deviation = latencyMean_ms - config.criticalLatencyThreshold_ms;
            latencyRisk += Math.min(0.5, deviation * 0.015); // Capping contribution to prevent runaway risk
        }

        // Stress Risk: Weighted directly.
        const stressRisk = stressIndex * config.stressRiskWeight;
        
        // Summation must ensure the output is appropriate for the target GSEP model.
        return latencyRisk + stressRisk;
    }
}

module.exports = ContextualRuntimeMonitor;