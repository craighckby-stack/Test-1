import path from 'path';
import { ConfigCoercer } from "../plugins/ConfigCoercer";

// --- Type Definition for Configuration Structure ---
export interface Configuration {
  NODE_ENV: 'development' | 'production' | 'test';
  PROJECT_ROOT: string;
  SERVER_PORT: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // Specific System Paths
  EVENT_CONTRACT_PATH: string;
  // Add more structured configuration fields here...
}

const NODE_ENV_VALUES: Configuration['NODE_ENV'][] = ['development', 'production', 'test'];
const LOG_LEVEL_VALUES: Configuration['LOG_LEVEL'][] = ['debug', 'info', 'warn', 'error'];

const DEFAULT_CONFIG: Partial<Configuration> = {
    NODE_ENV: 'development',
    SERVER_PORT: 3000,
    LOG_LEVEL: 'info',
};

// --- Configuration Service Implementation ---

/**
 * ConfigurationService provides centralized, strongly-typed access to 
 * system configurations, prioritizing environment variables over predefined defaults.
 * It employs a static lazy-loading strategy (Singleton pattern).
 */
export class ConfigurationService {
    private static config: Configuration | null = null;

    /**
     * Initializes the configuration object by calculating project paths
     * and merging environment variables with predefined defaults.
     * Utilizes ConfigCoercer for robust parsing and validation.
     * @returns The fully constructed Configuration object.
     */
    private static initialize(): Configuration {
        // Determine PROJECT_ROOT: resolves two directories up from the service file location (src/config -> src -> ROOT).
        const SAFE_PROJECT_ROOT = path.resolve(__dirname, '../../');

        // Use ConfigCoercer for robust parsing, fallback, and validation.
        const serverPort = ConfigCoercer.coerce({
            source: process.env,
            key: 'PORT',
            defaultValue: DEFAULT_CONFIG.SERVER_PORT,
            type: 'number',
            // Enforce positive port number, eliminating the need for manual NaN/range checks.
            validation: { min: 1 }, 
        }) as number;

        const nodeEnv = ConfigCoercer.coerce({
            source: process.env,
            key: 'NODE_ENV',
            defaultValue: DEFAULT_CONFIG.NODE_ENV,
            type: 'enum',
            validation: { valid_values: NODE_ENV_VALUES }
        }) as Configuration['NODE_ENV'];

        const logLevel = ConfigCoercer.coerce({
            source: process.env,
            key: 'LOG_LEVEL',
            defaultValue: DEFAULT_CONFIG.LOG_LEVEL,
            type: 'enum',
            validation: { valid_values: LOG_LEVEL_VALUES }
        }) as Configuration['LOG_LEVEL'];

        const effectiveConfig: Configuration = {
            NODE_ENV: nodeEnv,
            PROJECT_ROOT: SAFE_PROJECT_ROOT,
            SERVER_PORT: serverPort,
            LOG_LEVEL: logLevel,
            
            // System paths derived from the project root
            EVENT_CONTRACT_PATH: path.join(SAFE_PROJECT_ROOT, 'config', 'TEDS_event_contract.json'),
        };

        return effectiveConfig;
    }

    /**
     * Retrieves a configuration setting.
     * Configuration is loaded only upon the first request (lazy initialization).
     * @param key The configuration key.
     */
    public static get<K extends keyof Configuration>(key: K): Configuration[K] {
        if (!ConfigurationService.config) {
            ConfigurationService.config = ConfigurationService.initialize();
        }
        
        // The initialization guarantees all keys are present.
        return ConfigurationService.config[key];
    }
}