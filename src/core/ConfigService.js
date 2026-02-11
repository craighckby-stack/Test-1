/**
 * Sovereign AGI v95.0 - ConfigService
 * Function: Centralized service for loading, parsing, and providing runtime configuration parameters.
 * Ensures type safety and consistent defaults across all modules by utilizing the EnvironmentConfigLoader.
 */

// --- Type Definitions ---
interface ConfigDefinitionItem {
    type: 'string' | 'number' | 'boolean';
    default: any;
    envKey?: string; // Optional environment variable override key
}

type ConfigDefinition = Record<string, ConfigDefinitionItem>;

// Define keys for internal consistency and type hinting
type CoreConfigKeys = 'AGI_VERSION' | 'ENVIRONMENT' | 'LOG_LEVEL' | 'LOG_DESTINATION' | 'API_PORT';

// Assuming the plugin interface is available via __AGI_PLUGINS__
declare const __AGI_PLUGINS__: {
    EnvironmentConfigLoader: {
        load(definition: ConfigDefinition, envMap: Record<string, any>): Record<string, any>;
    };
};

class ConfigService {
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

    private _config: Record<string, any>;

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
            // Fallback to basic defaults if plugin loading fails
            console.error(
                `[ConfigService] FATAL: EnvironmentConfigLoader plugin failed. Falling back to default configuration. Error: ${e instanceof Error ? e.message : String(e)}`
            );

            return Object.keys(this.CONFIG_DEFINITION).reduce((acc, key) => {
                acc[key] = this.CONFIG_DEFINITION[key].default;
                return acc;
            }, {} as Record<string, any>);
        }
    }

    /**
     * Retrieves a configuration value by key.
     * @param {CoreConfigKeys | string} key - The configuration key (e.g., 'LOG_LEVEL').
     * @returns {T | null} The configuration value, typed generic T, or null if key is undefined.
     */
    public get<T = any>(key: CoreConfigKeys | string): T | null {
        if (!Object.prototype.hasOwnProperty.call(this._config, key)) {
            console.warn(`[ConfigService] Attempted access to undefined configuration key: ${key}. This should be defined in CONFIG_DEFINITION.`);
            return null; 
        }
        return this._config[key] as T;
    }
}

// Enforce Singleton Pattern
const instance = new ConfigService();
// Freeze the instance to prevent external modification of methods/properties
Object.freeze(instance);

module.exports = instance;