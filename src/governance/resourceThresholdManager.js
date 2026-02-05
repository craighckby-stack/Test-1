/**
 * Component ID: RTM
 * Name: Resource Threshold Manager
 * Function: Manages and provides environment-specific or historically tuned resource constraint thresholds
 *           to the Resource Constraint Evaluator (RCE). Enables dynamic tuning and environment profiling.
 * GSEP Alignment: Stage 3 Configuration Support (P-01 Input refinement)
 */

class ResourceThresholdManager {
    /**
     * @param {Object} configService - Core service to load general application configuration.
     * @param {string} environmentProfile - E.g., 'production', 'staging', 'dev_vm'.
     */
    constructor(configService, environmentProfile = 'production') {
        this.configService = configService;
        this.environmentProfile = environmentProfile;
        this.baseConfiguration = this._loadBaseConfig();
    }

    /**
     * Loads base, globally accepted thresholds. 
     * @private
     */
    _loadBaseConfig() {
        // Default structure matching RCE expectations
        return {
            cpu_util: { threshold: 0.85, weight: 0.40, severity_boost: 1.5 },
            memory_used_ratio: { threshold: 0.90, weight: 0.50, severity_boost: 2.0 },
            io_wait_factor: { threshold: 0.60, weight: 0.10, severity_boost: 1.2 }
        };
    }

    /**
     * Fetches configuration overrides specific to the current operating environment.
     * This logic is critical for autonomous operation in heterogeneous cloud/local environments.
     * @private
     */
    _loadEnvironmentOverrides() {
        // Placeholder: load from external ConfigService or environment variables
        if (this.environmentProfile === 'dev_vm') {
            // Relaxed thresholds for development environments
            return {
                cpu_util: { threshold: 0.95, weight: 0.35, severity_boost: 1.0 }, 
                memory_used_ratio: { threshold: 0.98, weight: 0.40, severity_boost: 1.5 } 
            };
        }
        return {};
    }

    /**
     * Public method for RCE to retrieve the aggregated, tuned configuration.
     * @returns {Object} Merged configuration object defining current operating constraints.
     */
    getTunedConstraintConfig() {
        const overrides = this._loadEnvironmentOverrides();
        
        // Merge base config with environment-specific overrides
        const tunedConfig = { ...this.baseConfiguration };
        
        for (const [key, profileConfig] of Object.entries(overrides)) {
            tunedConfig[key] = {
                ...tunedConfig[key],
                ...profileConfig
            };
        }

        // TODO: Integration point for Adaptive Tuning (Stage 4 GSEP)

        return tunedConfig;
    }
}

module.exports = ResourceThresholdManager;