/**
 * ConfigurationService.ts
 * Provides a centralized way to manage system constants and paths, 
 * abstracting away environment-specific concerns (like file paths or database credentials).
 */

import path from 'path';

interface Configuration {
  EVENT_CONTRACT_PATH: string;
  // Add other shared configuration settings here (e.g., ENVIRONMENT, DB_HOST)
}

export class ConfigurationService {
    private static config: Configuration;

    /**
     * Loads configuration settings based on the execution environment.
     * NOTE: In a full system, this would load data from .env files or a vault.
     */
    private static initialize(): Configuration {
        const ENVIRONMENT = process.env.NODE_ENV || 'development';

        // Define standardized paths relative to project root (assuming standard execution context)
        const PROJECT_ROOT = path.resolve(__dirname, '../../'); 

        return {
            EVENT_CONTRACT_PATH: path.join(PROJECT_ROOT, 'config', 'TEDS_event_contract.json'),
            // ... other configurations
        };
    }

    /**
     * Retrieves a configuration setting.
     * @param key The configuration key.
     */
    public static get<K extends keyof Configuration>(key: K): Configuration[K] {
        if (!ConfigurationService.config) {
            ConfigurationService.config = ConfigurationService.initialize();
        }
        if (!ConfigurationService.config[key]) {
             throw new Error(`Configuration key "${key}" not found.`);
        }
        return ConfigurationService.config[key];
    }
}