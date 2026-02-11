const path = require('path');

/**
 * Utility tool for deep merging objects. (Replaces original inline function).
 */
class DeepMergeUtilityTool {
    static deepMerge(target, source) {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] instanceof Object && !Array.isArray(source[key])) {
                    target[key] = DeepMergeUtilityTool.deepMerge(target[key] || {}, source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }
}

// Assuming the abstracted tool is available via require
// In a full environment, this would be injected: const DotPathUtilityTool = require('../utils/DotPathUtilityTool');
// We define a placeholder to ensure the code references the external tool correctly.
const DotPathUtilityTool = require('../utils/DotPathUtilityTool');

/**
 * Determine the absolute root directory of the project based on relative path from configManager.js
 */
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const DEFAULTS = {
    // Core identification and paths
    app: {
        id: 'sovereign-agi',
        root: ROOT_DIR,
    },
    // Directory names
    dirs: {
        logs: 'logs',
        temp: 'temp',
    },
    // Logging configuration defaults and env mapping
    logging: {
        logLevel: 'info', // Can be overridden via ENV
        auditFileName: 'ogt_decisions.jsonl',
        envMap: {
            // Map environment variable keys to config object keys (dot notation)
            LOG_LEVEL: 'logging.logLevel',
            LOGS_DIR_NAME: 'dirs.logs',
            AUDIT_FILE_NAME: 'logging.auditFileName'
        }
    }
};

class ConfigManager {
    static #config: Record<string, any> = {}; // Use private field for encapsulation

    /**
     * Loads defaults, environment variables, and calculates derived configuration values.
     */
    static initialize(): void {
        if (Object.keys(ConfigManager.#config).length > 0) {
            // Already initialized
            return;
        }

        // 1. Start with defaults (deep clone for safe mutation) using the DeepMergeUtilityTool
        let configData = DeepMergeUtilityTool.deepMerge({}, DEFAULTS);

        // 2. Apply Environment Overrides
        const envOverrides: Record<string, any> = {};
        const envMap = configData.logging.envMap;
        
        for (const [envKey, configKey] of Object.entries(envMap)) {
            const envValue = process.env[envKey];
            if (envValue !== undefined) {
                // Use the DotPathUtilityTool for setting values
                DotPathUtilityTool.set(envOverrides, configKey, envValue);
            }
        }

        // Merge environment overrides onto defaults using the DeepMergeUtilityTool
        configData = DeepMergeUtilityTool.deepMerge(configData, envOverrides);
        delete configData.logging.envMap; // Clean up the map after use

        // 3. Calculate Derived Paths
        const logsDirPath = path.join(configData.app.root, configData.dirs.logs);

        // Calculate full audit log path
        configData.logging.auditPath = path.join(
            logsDirPath,
            configData.logging.auditFileName
        );
        
        ConfigManager.#config = configData;
    }

    /**
     * Retrieves a configuration value by dot notation key (e.g., 'logging.auditPath')
     * @param {string} key - Dot-separated path to the configuration value.
     * @returns {any | undefined}
     */
    static get(key: string): any | undefined {
        if (Object.keys(ConfigManager.#config).length === 0) {
            // Auto-initialize if necessary, though explicit initialize is preferred
            ConfigManager.initialize();
        }

        // Use the DotPathUtilityTool for safe path retrieval
        return DotPathUtilityTool.get(ConfigManager.#config, key);
    }
}

ConfigManager.initialize(); // Initialize immediately upon module load
module.exports = ConfigManager;