import path from 'path';

/**
 * ConfigService: Centralized Configuration and Environment Management
 * Role: Defines global application constants, manages environment variables,
 * and provides standardized path resolution using the native 'path' module.
 *
 * NOTE: Assumes EnvTypeDecoder is globally available via the AGI Kernel.
 */
class ConfigService {
    // Conceptual reference to the utility extracted as a plugin
    private envTypeDecoder: { execute: (value: string) => any };

    constructor() {
        // Initialize the conceptual tool (assuming global injection or access)
        // @ts-ignore
        this.envTypeDecoder = typeof EnvTypeDecoder !== 'undefined' ? EnvTypeDecoder : { execute: (v: any) => v };

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
    getEnvironment(): string {
        return this.NODE_ENV;
    }

    /**
     * Standardizes critical application paths.
     * @param filename The name of the config file (e.g., 'governance').
     * @param extension The expected file extension.
     * @returns The full path to the configuration file.
     */
    getConfigPath(filename: string, extension: string = '.yaml'): string {
        return path.join(this.CONFIG_DIR, `${filename}${extension}`);
    }

    /**
     * Gets a variable based on environment preference or default, with type parsing.
     * @param key The environment variable key.
     * @param defaultValue The fallback value.
     * @returns The retrieved and parsed value (string|number|boolean|*).
     */
    getEnv(key: string, defaultValue: any): any {
        const envValue = process.env[key];

        if (envValue !== undefined) {
            // Use the extracted utility for parsing the string value
            return this.envTypeDecoder.execute(envValue);
        }

        // Ensure the default value is also run through parsing if it is a string representation
        if (typeof defaultValue === 'string') {
             return this.envTypeDecoder.execute(defaultValue);
        }

        return defaultValue;
    }

    /**
     * Helper to get a strictly typed boolean environment variable.
     */
    getBool(key: string, defaultValue: boolean = false): boolean {
        // We use strict comparison to true, ensuring type safety after parsing
        return this.getEnv(key, defaultValue) === true;
    }
}

// Export a singleton instance
export default new ConfigService();
