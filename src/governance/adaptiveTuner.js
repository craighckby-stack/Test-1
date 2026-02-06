/**
 * Component ID: ATN
 * Name: Adaptive Tuner
 * Function: Monitors historical telemetry and real-time operational metrics to provide dynamic adjustments
 *           to the Resource Threshold Manager (RTM) configuration, ensuring optimal operational envelope.
 * GSEP Alignment: Stage 4 Autonomous Optimization (T-02 Dynamic Parameter Adjustment)
 */

class AdaptiveTuner {
    /**
     * @param {Object} telemetryService - Service providing historical metrics and performance data.
     * @param {Object} systemMonitorService - Service providing current resource utilization data.
     */
    constructor(telemetryService, systemMonitorService) {
        this.telemetryService = telemetryService;
        this.systemMonitorService = systemMonitorService;
        this.tuningModel = this._loadTuningModel();
    }

    /**
     * Loads the model or heuristics used to determine threshold adjustments.
     * @private
     */
    _loadTuningModel() {
        // Placeholder for loading a sophisticated ML model or tuning heuristics.
        return {
            recent_anomaly_tolerance: 3, // Max minor anomalies tolerated per hour
            adjustment_factor: 0.05      // Percentage change applied to thresholds
        };
    }

    /**
     * Calculates required threshold adjustments based on recent system state.
     * This logic forms the core of Stage 4 Autonomous Optimization.
     * @param {Object} currentConfig - The static configuration provided by RTM.
     * @returns {Object} A map of metric keys to adjustment objects (e.g., { cpu_util: { threshold: 0.82 } }).
     */
    getAdjustments(currentConfig) {
        const adjustments = {};
        
        // Simulation of telemetry analysis
        // In reality, this would involve complex queries or model inference.
        const recentHistory = this.telemetryService.getRecentOperationalSummary();

        if (recentHistory.averageAnomalyCount > this.tuningModel.recent_anomaly_tolerance) {
            // System is frequently hitting thresholds -> tighten constraints (lower threshold value)
            const factor = this.tuningModel.adjustment_factor;
            
            if (currentConfig.cpu_util) {
                adjustments.cpu_util = { 
                    threshold: currentConfig.cpu_util.threshold * (1 - factor)
                };
            }
        } else if (recentHistory.averageUtilization < 0.30) {
            // System is very underutilized -> relax constraints (higher threshold value)
            const factor = this.tuningModel.adjustment_factor / 2;
            
            if (currentConfig.memory_used_ratio) {
                adjustments.memory_used_ratio = { 
                    threshold: currentConfig.memory_used_ratio.threshold * (1 + factor)
                };
            }
        }
        
        return adjustments;
    }
}

module.exports = AdaptiveTuner;