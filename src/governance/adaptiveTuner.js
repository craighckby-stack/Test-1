/**
 * Component ID: ATN
 * Name: Adaptive Tuner (v94.1 Refactor)
 * Function: Monitors historical telemetry and real-time operational metrics using standardized evaluation
 *           to provide dynamic, controlled adjustments to system governance configurations (like RTM).
 * GSEP Alignment: Stage 4 Autonomous Optimization (T-02 Dynamic Parameter Adjustment)
 * Rationale: Increased generality, parameterized adjustment control, separation of mathematical evaluation logic,
 *            and implementation of adjustment damping based on volatility and hard limits.
 */

// AGI-KERNEL PLUGIN INJECTION: AdaptiveParameterTuner handles the bounded, damped adjustment calculation.
declare const AdaptiveParameterTuner: { execute: (args: any) => number | null }; 

// Placeholder dependency for robust mathematical analysis. This function is passed to the plugin.
const { calculateVolatility } = require('./tuningEngine/StatisticalEvaluator'); 

class AdaptiveTuner {
    /**
     * @param {Object} telemetryService - Service providing historical metrics and performance data.
     * @param {Object} systemMonitorService - Service providing current resource utilization data.
     */
    constructor(telemetryService, systemMonitorService) {
        this.telemetryService = telemetryService;
        this.systemMonitorService = systemMonitorService;
        // Centralized tuning profile holding factors and limits
        this.tuningProfile = this._initializeTuningProfile(); 
    }

    /**
     * Initializes the parameterized model defining tuning limits, weights, and stabilization behaviors.
     * @private
     * @returns {Object} Tuning configuration profile.
     */
    _initializeTuningProfile() {
        return {
            // General governance controls
            MAX_ADJUSTMENT_FACTOR: 0.10, // Max proportional change allowed per cycle (10%)
            MIN_THRESHOLD_DRIFT_PERCENT: 0.005, // Minimum proportional change required to enact adjustment (0.5%)
            ANOMALY_SENSITIVITY: 3,      // Number of tolerated global anomalies per evaluation window

            // Metric-specific tuning parameters (generalized schema)
            metrics: {
                cpu_util: {
                    weight: 0.6, // Priority/aggressiveness factor
                    baseline_target: 0.75, // Ideal average utilization target
                    min_limit: 0.50, // Hard lower threshold limit
                    max_limit: 0.95, // Hard upper threshold limit
                },
                memory_used_ratio: {
                    weight: 0.4,
                    baseline_target: 0.80,
                    min_limit: 0.60,
                    max_limit: 0.98,
                }
            }
        };
    }

    /**
     * Evaluates a single metric using recent history, calculating proportional adjustment needed and applying safety limits.
     * This logic is delegated to the AdaptiveParameterTuner plugin.
     * @private
     * @param {string} metricKey - Key of the metric (e.g., 'cpu_util').
     * @param {number} currentValue - The current threshold value for this metric.
     * @param {Object} recentHistory - Summary statistics and raw data for the metric.
     * @returns {number | null} The final calculated bounded threshold value, or null if adjustment is insignificant.
     */
    _evaluateMetricAdjustment(metricKey, currentValue, recentHistory) {
        const params = this.tuningProfile.metrics[metricKey];
        if (!params || !currentValue) return null;

        // Prepare arguments for the external tuning tool
        const adjustmentArgs = {
            currentValue: currentValue,
            history: recentHistory,
            metricParams: params,
            globalProfile: {
                MAX_ADJUSTMENT_FACTOR: this.tuningProfile.MAX_ADJUSTMENT_FACTOR,
                MIN_THRESHOLD_DRIFT_PERCENT: this.tuningProfile.MIN_THRESHOLD_DRIFT_PERCENT
            },
            // Pass the imported statistical function for advanced volatility calculation
            volatilityFn: calculateVolatility
        };
        
        // Delegate calculation to the specialized tuning plugin
        if (typeof AdaptiveParameterTuner !== 'undefined' && AdaptiveParameterTuner.execute) {
            return AdaptiveParameterTuner.execute(adjustmentArgs);
        } else {
             // CRITICAL: Handle missing plugin if necessary, though AGI-KERNEL guarantees injection
             console.warn("AdaptiveParameterTuner not available. Cannot calculate adjustments.");
             return null;
        }
    }

    /**
     * Calculates required threshold adjustments based on recent system state using parameterized analysis.
     * @param {Object} currentConfig - The current configuration schema from RTM, mapped by metric keys.
     *                                (e.g., { cpu_util: { threshold: 0.80, unit: '%' } })
     * @returns {Object} A map of metric keys to adjustment objects (e.g., { cpu_util: { threshold: 0.78 } }).
     */
    getAdjustments(currentConfig) {
        const adjustments = {};
        
        // Retrieve generalized summary statistics for all metrics relevant to tuning
        const metricKeys = Object.keys(this.tuningProfile.metrics);
        const operationalSummary = this.telemetryService.getRecentOperationalSummary(metricKeys); // Now requests data for specific keys

        for (const metricKey of metricKeys) {
            if (currentConfig[metricKey] && operationalSummary[metricKey]) {
                const currentValue = currentConfig[metricKey].threshold;
                const history = operationalSummary[metricKey];

                const adjustedThreshold = this._evaluateMetricAdjustment(
                    metricKey, 
                    currentValue, 
                    history
                );

                if (adjustedThreshold !== null) {
                    adjustments[metricKey] = {
                        threshold: adjustedThreshold
                    };
                }
            }
        }
        
        return adjustments;
    }
}

module.exports = AdaptiveTuner;