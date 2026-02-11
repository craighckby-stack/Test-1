import path from 'path';
import EnvTypeDecoder from '../plugins/EnvTypeDecoder'; 

/**
 * ConfigService: Centralized Configuration and Environment Management
 * Role: Defines global application constants, manages environment variables,
 * and provides standardized path resolution using the native 'path' module.
 */
class ConfigService {

    constructor() {
        // Environment initialization
        this.NODE_ENV = process.env.NODE_ENV || 'development';
        this.IS_PRODUCTION = this.NODE_ENV === 'production';
        this.IS_DEVELOPMENT = this.NODE_ENV === 'development';

        // Path initialization (using path.resolve for robustness)
        this.ROOT_DIR = path.resolve(process.cwd());
        this.SRC_DIR = path.join(this.ROOT_DIR, 'src');
        this.CONFIG_DIR = path.join(this.SRC_DIR, 'config');
        this.LOGS_DIR = path.join(this.ROOT_DIR, 'logs');
    }

    /**
     * Retrieves the current environment string.
     */
    getEnvironment() {
        return this.NODE_ENV;
    }

    /**
     * Standardizes critical application paths.
     * @param {string} filename The name of the config file (e.g., 'governance').
     * @param {string} [extension='.yaml'] The expected file extension.
     * @returns {string} The full path to the configuration file.
     */
    getConfigPath(filename, extension = '.yaml') {
        return path.join(this.CONFIG_DIR, `${filename}${extension}`);
    }

    /**
     * Gets a variable based on environment preference or default, with type parsing.
     * Uses the EnvTypeDecoder plugin for conversion.
     * @param {string} key The environment variable key.
     * @param {any} defaultValue The fallback value.
     * @returns {any} The retrieved and parsed value (string|number|boolean|*).
     */
    getEnv(key, defaultValue) {
        const envValue = process.env[key];

        if (envValue !== undefined) {
            // Use the imported plugin instance
            return EnvTypeDecoder.execute(envValue);
        }

        // If default value is provided, ensure it is also parsed if it's a string
        if (typeof defaultValue === 'string') {
             return EnvTypeDecoder.execute(defaultValue);
        }

        return defaultValue;
    }

    /**
     * Helper to get a strictly typed boolean environment variable.
     */
    getBool(key, defaultValue = false) {
        // We ensure strict comparison to true, utilizing the parser logic in getEnv
        return this.getEnv(key, defaultValue) === true;
    }
}

// Export a singleton instance
export default new ConfigService();