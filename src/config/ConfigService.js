/**
 * ConfigService: Centralized Configuration and Environment Management
 * Role: Defines global application constants, manages environment variables,
 * and provides path resolution for various system components.
 * GovernanceLoader should ideally source its GOVERNANCE_CONFIG_PATH from this service.
 */

class ConfigService {
    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || 'development';
        this.ROOT_DIR = process.cwd();
        this.CONFIG_DIR = `${this.ROOT_DIR}/config`;
    }

    /**
     * Retrieves the current environment string (e.g., 'production', 'development').
     */
    getEnvironment() {
        return this.NODE_ENV;
    }

    /**
     * Standardizes critical application paths.
     * @param {string} configName The name of the config file (e.g., 'governance').
     * @returns {string} The full path to the configuration file.
     */
    getConfigPath(configName) {
        return `${this.CONFIG_DIR}/${configName}.yaml`;
    }

    /**
     * Gets a variable based on environment preference or default.
     * @param {string} key The environment variable key.
     * @param {*} defaultValue The fallback value.
     */
    getEnv(key, defaultValue) {
        return process.env[key] || defaultValue;
    }
}

export default new ConfigService();
