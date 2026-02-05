// CRM (Contextual Runtime Monitor) v1.0
// GSEP Alignment: Stage 3 (P-01 Adjudication Input S-02)
// Function: Provides high-frequency, non-blocking telemetry stream for external and environment constraints (e.g., network latency, critical API uptime, I/O saturation).

class ContextualRuntimeMonitor {
    constructor(telemetrySourceConfig) {
        this.config = telemetrySourceConfig;
        this.latencyHistory = [];
        this.maxHistorySize = 1000;
    }

    /**
     * Fetches and validates current real-time environmental metrics.
     * @returns {Object} currentMetrics - Latency, external stress indices, etc.
     */
    async getRealtimeMetrics() {
        // Simulated logic for fetching current external state, high-priority telemetry
        const externalLatency = this._fetchCriticalLatency();
        const externalStressIndex = this._calculateExternalStress();
        
        this._updateHistory(externalLatency);

        return {
            timestamp: Date.now(),
            latencyMean_ms: this._getMeanLatency(),
            stressIndex: externalStressIndex,
            telemetryReliability: 0.999 // Self-monitoring metric
        };
    }

    _fetchCriticalLatency() {
        // Implement low-level, high-speed pings or buffer checks
        return Math.floor(Math.random() * 50) + 5; // Placeholder
    }

    _calculateExternalStress() {
        // Logic to interpret external saturation (e.g., external API rate limits)
        return Math.random().toFixed(2);
    }

    _updateHistory(latency) {
        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > this.maxHistorySize) {
            this.latencyHistory.shift();
        }
    }

    _getMeanLatency() {
        if (this.latencyHistory.length === 0) return 0;
        const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
        return sum / this.latencyHistory.length;
    }

    /**
     * Called by C-11 (MCRA Engine) to calculate environmental impact on Risk Floor (S-02).
     * @returns {number} Environmental risk coefficient (0.0 to 1.0).
     */
    async calculateEnvironmentalRiskFactor() {
        const metrics = await this.getRealtimeMetrics();
        // High latency or stress increases the risk factor dynamically.
        const latencyRisk = (metrics.latencyMean_ms > 40) ? 0.3 : 0.05;
        const stressRisk = parseFloat(metrics.stressIndex) * 0.4;
        
        // The RCE handles internal resource scarcity; CRM focuses on infrastructure instability.
        return latencyRisk + stressRisk;
    }
}

module.exports = ContextualRuntimeMonitor;