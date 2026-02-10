/**
 * Sovereign AGI v95.0 - ConfigService
 * Function: Centralized service for loading, parsing, and providing runtime configuration parameters.
 * Ensures type safety and consistent defaults across all modules by utilizing the EnvironmentConfigLoader.
 */

// --- Type Definitions (TypeScript allowed in improved code) ---
interface ConfigDefinitionItem {
    type: 'string' | 'number' | 'boolean';
    default: any;
    envKey?: string; // Optional environment variable override key
}

type ConfigDefinition = Record<string, ConfigDefinitionItem>;

// Assuming the plugin interface is available via __AGI_PLUGINS__
declare const __AGI_PLUGINS__: {
    EnvironmentConfigLoader: {
        load(definition: ConfigDefinition, envMap: Record<string, any>): Record<string, any>;
    };
};

class ConfigService {
    private _config: Record<string, any>;
    
    // Declarative schema for configuration
    private readonly CONFIG_DEFINITION: ConfigDefinition = {
        // Core System Settings
        AGI_VERSION: { type: 'string', default: 'v95.0', envKey: 'AGI_VERSION' },
        ENVIRONMENT: { type: 'string', default: 'development', envKey: 'NODE_ENV' },
        
        // Logging Settings (Used by AgiLogger)
        LOG_LEVEL: { type: 'string', default: 'INFO', envKey: 'AGI_LOG_LEVEL' },
        LOG_DESTINATION: { type: 'string', default: 'stdout', envKey: 'AGI_LOG_DESTINATION' },

        // Default ports/resources
        API_PORT: { type: 'number', default: 3000, envKey: 'API_PORT' },
        // ... other system settings (SRM limits, Memory capacity, etc.)
    };

    constructor() {
        this._config = this._loadConfiguration();
    }

    /**
     * Loads configuration using the EnvironmentConfigLoader plugin to handle defaults and coercion.
     */
    private _loadConfiguration(): Record<string, any> {
        // Use the extracted plugin for robust configuration handling
        try {
            const loader = __AGI_PLUGINS__.EnvironmentConfigLoader;
            return loader.load(this.CONFIG_DEFINITION, process.env);
        } catch (e) {
            console.error("FATAL: EnvironmentConfigLoader plugin missing or failed to initialize.", e);
            // Fallback to basic defaults if plugin loading fails
            return Object.keys(this.CONFIG_DEFINITION).reduce((acc, key) => {
                acc[key] = this.CONFIG_DEFINITION[key].default;
                return acc;
            }, {});
        }
    }

    /**
     * Gets a configuration value by key.
     * @param {string} key - The configuration key (e.g., 'LOG_LEVEL').
     * @returns {any} The configuration value.
     */
    public get(key: string): any {
        if (!this._config.hasOwnProperty(key)) {
            console.warn(`Configuration key not found: ${key}. This should be defined in CONFIG_DEFINITION.`);
            return null; 
        }
        return this._config[key];
    }
}

// Enforce Singleton Pattern
const instance = new ConfigService();
Object.freeze(instance);

module.exports = instance;