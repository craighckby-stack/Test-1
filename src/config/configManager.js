const path = require('path');

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

/**
 * Utility function to recursively merge two objects (deep merge).
 * NOTE: This logic is provided by the DeepMergeUtilityTool plugin.
 */
function deepMerge(target: any, source: any): any {
    // Implementation relies on DeepMergeUtilityTool.execute(target, source)
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                target[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}

class ConfigManager {
    static #config: Record<string, any> = {}; // Use private field for encapsulation

    /**
     * Safely sets a value in an object using a dot notation key path, creating intermediate objects if necessary.
     */
    private static setByDotPath(obj: Record<string, any>, pathKey: string, value: any): void {
        const parts = pathKey.split('.');
        let temp = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            // Ensure intermediate path exists and is an object
            temp[part] = temp[part] || {};
            if (typeof temp[part] !== 'object' || Array.isArray(temp[part])) {
                // Defensive programming: reset if path segment wasn't an object
                temp[part] = {};
            }
            temp = temp[part];
        }
        
        temp[parts[parts.length - 1]] = value;
    }

    /**
     * Loads defaults, environment variables, and calculates derived configuration values.
     */
    static initialize(): void {
        if (Object.keys(ConfigManager.#config).length > 0) {
            // Already initialized
            return;
        }

        // 1. Start with defaults (deep clone for safe mutation) using the deepMerge utility
        let configData = deepMerge({}, DEFAULTS);

        // 2. Apply Environment Overrides
        const envOverrides: Record<string, any> = {};
        const envMap = configData.logging.envMap;
        
        for (const [envKey, configKey] of Object.entries(envMap)) {
            const envValue = process.env[envKey];
            if (envValue !== undefined) {
                // Use the new private utility helper
                ConfigManager.setByDotPath(envOverrides, configKey, envValue);
            }
        }

        // Merge environment overrides onto defaults using the deepMerge utility
        configData = deepMerge(configData, envOverrides);
        delete configData.logging.envMap; // Clean up the map after use

        // 3. Calculate Derived Paths
        const logsDirPath = path.join(configData.app.root, configData.dirs.logs);

        // Calculate full audit log path
        configData.logging.auditPath = path.join(
            logsDirPath,
            configData.logging.auditFileName
        );
        
        ConfigManager.#config = configData;
        // console.log('[C-00] Configuration initialized.');
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

        // Use short-circuiting reducer to safely navigate the object path
        return key.split('.').reduce((acc, part) => (acc === undefined || acc === null) ? undefined : acc[part], ConfigManager.#config);
    }
}

ConfigManager.initialize(); // Initialize immediately upon module load
module.exports = ConfigManager;