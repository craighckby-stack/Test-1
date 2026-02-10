/**
 * Component ID: RTM
 * Name: Resource Threshold Manager
 * Function: Manages and provides environment-specific or historically tuned resource constraint thresholds
 *           to the Resource Constraint Evaluator (RCE). Enables dynamic tuning and environment profiling.
 * GSEP Alignment: Stage 3 Configuration Support (P-01 Input refinement)
 */

const DEFAULT_THRESHOLDS = {
    cpu_util: { threshold: 0.85, weight: 0.40, severity_boost: 1.5 },
    memory_used_ratio: { threshold: 0.90, weight: 0.50, severity_boost: 2.0 },
    io_wait_factor: { threshold: 0.60, weight: 0.10, severity_boost: 1.2 }
};

/** 
 * Placeholder for the external ConfigurationMergeUtility factory function.
 * Assumes availability through the kernel environment.
 * @typedef {Object} ConfigMergerTool
 * @property {function(Object): Object} execute - Executes the merge operation.
 */

/**
 * @type {function(): ConfigMergerTool}
 */
const ConfigurationMergeUtility = (typeof global !== 'undefined' && global.ConfigurationMergeUtility) 
    ? global.ConfigurationMergeUtility : 
    () => ({ 
        execute: ({ baseConfig, overrides }) => { 
            // Fallback implementation, should rely on kernel provided tool
            let merged = { ...baseConfig };
            for (const key in overrides) {
                if (overrides.hasOwnProperty(key)) {
                    merged[key] = { ...(merged[key] || {}), ...overrides[key] };
                }
            }
            return merged;
        }
    });

class ResourceThresholdManager {
    /**
     * @param {Object} configService - Core service to load general application configuration.
     * @param {string} environmentProfile - E.g., 'production', 'staging', 'dev_vm'.
     * @param {Object|null} adaptiveTuner - Optional component for runtime adjustment (ATN).
     */
    constructor(configService, environmentProfile = 'production', adaptiveTuner = null) {
        if (!configService || typeof configService.get !== 'function') {
            throw new Error("RTM requires a valid ConfigService instance.");
        }
        
        this.configService = configService;
        this.environmentProfile = environmentProfile;
        this.adaptiveTuner = adaptiveTuner;
        
        // Use the extracted utility for all merge operations
        this.configMerger = ConfigurationMergeUtility();
        
        /** @private {Object|null} Cache for the fully resolved configuration. */
        this.cachedConfig = null;
        
        this._initializeConfiguration();
    }

    /**
     * Centralized configuration loading and merging using the ConfigService and Merger Utility.
     * @private
     */
    _initializeConfiguration() {
        // 1. Load Base Configuration (using hardcoded defaults as fallback)
        const baseConfig = this.configService.get('resourceThresholds.base') || DEFAULT_THRESHOLDS;

        // 2. Load Environment Overrides
        const overrides = this.configService.get(`resourceThresholds.profiles.${this.environmentProfile}`) || {};

        // 3. Merge configurations using the utility
        this.baseConfiguration = this.configMerger.execute({
            baseConfig: baseConfig,
            overrides: overrides
        });
    }

    /**
     * Applies dynamic adjustments from the Adaptive Tuner, if present, using the Merger Utility.
     * @private
     * @param {Object} currentConfig - The statically merged configuration.
     * @returns {Object} The dynamically adjusted configuration.
     */
    _applyAdaptiveTuning(currentConfig) {
        if (!this.adaptiveTuner || typeof this.adaptiveTuner.getAdjustments !== 'function') {
            return currentConfig;
        }
        
        const adjustments = this.adaptiveTuner.getAdjustments(currentConfig);
        
        // Use the utility for merging adjustments
        return this.configMerger.execute({
            baseConfig: currentConfig,
            overrides: adjustments
        });
    }

    /**
     * Public method for RCE to retrieve the aggregated, tuned configuration.
     * Caches the result unless explicitly requested to refresh.
     * @param {boolean} [refresh=false] - Force recalculation even if cached.
     * @returns {Object} Merged configuration object defining current operating constraints.
     */
    getTunedConstraintConfig(refresh = false) {
        if (this.cachedConfig && !refresh) {
            return this.cachedConfig;
        }

        // 1. Start with the statically loaded configuration
        let finalConfig = { ...this.baseConfiguration };
        
        // 2. Apply dynamic adjustments (Adaptive Tuning)
        finalConfig = this._applyAdaptiveTuning(finalConfig);

        this.cachedConfig = finalConfig;
        return finalConfig;
    }
}

module.exports = ResourceThresholdManager;
