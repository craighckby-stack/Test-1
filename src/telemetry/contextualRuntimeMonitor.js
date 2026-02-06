// CRM (Contextual Runtime Monitor) v3.0 - High-Efficiency Refactor
// GSEP Alignment: Stage 3 (P-01 Adjudication Input S-02)
// Function: Provides high-frequency, non-blocking telemetry stream for external and environment constraints.

const ExponentialMovingAverager = require('../utils/ExponentialMovingAverager');

class ContextualRuntimeMonitor {
    static NAME = 'CRM_v94.1_R3';
    static GSEP_ALIGNMENT = 'Stage 3 (P-01 Adjudication Input S-02)';

    /**
     * @param {Object} telemetrySourceConfig - Configuration.
     * @param {Object} [systemMonitor=null] - Optional dependency for real system data feeding stress calculation.
     */
    constructor(telemetrySourceConfig = {}, systemMonitor = null) {
        this.config = {
            latencyAlpha: 0.1, // Smoothing factor for EMA (0.0 < alpha < 1.0)
            criticalLatencyThreshold_ms: 40,
            staleDataThreshold_ms: 5000, // Data older than this begins to degrade reliability/increase risk.
            
            // Risk Model Parameters
            stressRiskWeight: 0.4,
            baseRiskFactor: 0.05,
            riskDeviationScale: 0.015, // Scale factor for risk accumulation above threshold
            maxLatencyRiskContribution: 0.5,
            ...telemetrySourceConfig
        };

        this.systemMonitor = systemMonitor;
        this.latencyEMA = new ExponentialMovingAverager(this.config.latencyAlpha);
        
        this.lastUpdateTime = 0;
        // Internal cached metrics (updated via updateMetrics)
        this.currentMetrics = {
            latencyMean_ms: 0,
            stressIndex: 0,
            telemetryReliability: 1.0, // 1.0 (reliable) down to 0.0 (unreliable)
            lastUpdateDuration_ms: Infinity
        };
    }

    /**
     * Fetches raw inputs (O(1) or very fast operations) and updates the internal state.
     * Made synchronous as internal calls are placeholders or intended to be very fast/O(1) system calls.
     */
    updateMetrics() {
        const now = Date.now();
        let success = true;

        try {
            const rawLatency = this._fetchCriticalLatency();
            const rawStressIndex = this._calculateExternalStress();

            // Update internal state only if fetching succeeded
            this.currentMetrics.latencyMean_ms = this.latencyEMA.update(rawLatency);
            this.currentMetrics.stressIndex = parseFloat(rawStressIndex);
            this.lastUpdateTime = now;
            
        } catch (e) {
            // In a real system, logging here is key. For performance, keep minimal.
            success = false;
        }

        // Reliability assessment based on staleness
        const updateDuration = now - this.lastUpdateTime;
        this.currentMetrics.lastUpdateDuration_ms = success ? updateDuration : updateDuration + 1; 
        
        const reliabilityDecayFactor = Math.min(1.0, this.currentMetrics.lastUpdateDuration_ms / this.config.staleDataThreshold_ms);
        
        // Decay reliability proportional to staleness (decay capped at 50% relative loss)
        this.currentMetrics.telemetryReliability = Math.max(
            0.1, 
            1.0 - (reliabilityDecayFactor * 0.5) 
        );
    }

    /**
     * Retrieves the last calculated set of environmental metrics.
     * @returns {Object} currentMetrics 
     */
    getRealtimeMetrics() {
        return { ...this.currentMetrics }; // Return defensive copy
    }

    // --- Private Fetchers (Optimized for O(1)) ---

    _fetchCriticalLatency() {
        // Placeholder implementation for low-level latency checks
        return Math.floor(Math.random() * 50) + 5; 
    }

    _calculateExternalStress() {
        // Uses injected SystemResourceMonitor if available
        if (this.systemMonitor && typeof this.systemMonitor.getNormalizedStressIndex === 'function') {
            return this.systemMonitor.getNormalizedStressIndex(); 
        }
        // Fallback to placeholder randomness
        return Math.random().toFixed(2);
    }
    
    // --- Risk Calculation ---

    /**
     * Calculates environmental impact on Risk Floor (S-02), factoring in data reliability.
     * @returns {number} Environmental risk coefficient (0.0 to 1.0, possibly slightly higher pre-clipping).
     */
    calculateEnvironmentalRiskFactor() {
        const { latencyMean_ms, stressIndex, telemetryReliability } = this.currentMetrics;
        const config = this.config;
        
        // 1. Latency Risk: Scaled based on deviation from threshold.
        let latencyRisk = config.baseRiskFactor; 
        if (latencyMean_ms > config.criticalLatencyThreshold_ms) {
            const deviation = latencyMean_ms - config.criticalLatencyThreshold_ms;
            
            latencyRisk += Math.min(
                config.maxLatencyRiskContribution, 
                deviation * config.riskDeviationScale
            ); 
        }

        // 2. External Stress Risk
        const stressRisk = stressIndex * config.stressRiskWeight;
        
        // 3. Reliability Amplification (Stale data = higher unknown risk)
        // Reliability 1.0 -> Factor 1.0
        // Reliability 0.1 -> Factor 1.9
        const reliabilityAmplificationFactor = 1.0 + (1.0 - telemetryReliability);

        let totalRisk = (latencyRisk + stressRisk) * reliabilityAmplificationFactor;
        
        // Clamp output to the model's expected range (0.0 to 1.0)
        return Math.min(1.0, Math.max(0.0, totalRisk)); 
    }
}

module.exports = ContextualRuntimeMonitor;