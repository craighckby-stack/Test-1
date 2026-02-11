/**
 * ConfigurationService
 * Handles loading, merging, and retrieving application configuration.
 * Priorities: Defaults -> Environment Variables
 */
class ConfigurationService {
    // Define static defaults for core settings
    static defaults = {
        PORT: 8080,
        LOG_LEVEL: 'info', // debug, info, warn, error
        MAX_CONTEXT_TOKENS: 4096,
        API_KEY_ENV_VAR: 'AGI_API_KEY',
        ENABLE_TELEMETRY: true,
        SERVICE_TIMEOUT_MS: 15000
    };

    constructor() {
        if (ConfigurationService.instance) {
            return ConfigurationService.instance;
        }

        this.config = { ...ConfigurationService.defaults };
        this._loadEnvironmentVariables();
        
        ConfigurationService.instance = this;
    }

    /**
     * Overrides default configuration using environment variables, ensuring proper type casting.
     * @private
     */
    _loadEnvironmentVariables() {
        const env = process.env;

        // Helper for parsing integers
        const parseInteger = (key, fallback) => {
            const value = parseInt(env[key], 10);
            return isNaN(value) ? fallback : value;
        };

        // Numeric overrides
        this.config.PORT = parseInteger('PORT', this.config.PORT);
        this.config.MAX_CONTEXT_TOKENS = parseInteger('MAX_CONTEXT_TOKENS', this.config.MAX_CONTEXT_TOKENS);
        this.config.SERVICE_TIMEOUT_MS = parseInteger('SERVICE_TIMEOUT_MS', this.config.SERVICE_TIMEOUT_MS);

        // String overrides
        if (env.LOG_LEVEL) {
            this.config.LOG_LEVEL = env.LOG_LEVEL.toLowerCase();
        }
        if (env.API_KEY_ENV_VAR) {
            this.config.API_KEY_ENV_VAR = env.API_KEY_ENV_VAR;
        }

        // Boolean overrides (Handles 'true'/'false' strings)
        if (env.ENABLE_TELEMETRY !== undefined) {
             this.config.ENABLE_TELEMETRY = String(env.ENABLE_TELEMETRY).toLowerCase() === 'true';
        }
    }

    /**
     * Retrieves a configuration value by key.
     * @param {string} key
     * @returns {any}
     */
    get(key) {
        const value = this.config[key];
        if (value === undefined) {
            // Use a warn for unknown access, but return undefined if missing
            console.warn(`[ConfigurationService] Accessing unknown key: ${key}`);
        }
        return value;
    }

    /**
     * Sets a configuration value at runtime (useful for testing or dynamic config).
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        this.config[key] = value;
    }
}

module.exports = new ConfigurationService();