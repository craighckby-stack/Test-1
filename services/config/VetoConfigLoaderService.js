/**
 * VetoConfigLoaderService
 * Responsible for locating, loading, caching, and potentially validating
 * the VETO trigger configurations based on system environment or target Asset ID.
 */

import fs from 'fs';
import path from 'path';

// CRITICAL: Assume ConfigNormalizationAndCacheUtility is injected or available.
// It handles cache lookups, normalization, and storage.

const DEFAULT_CONFIG_PATH = '../../assets/GAX/AHMID_VETO_TRIGGERS.json';

// Define the normalization rules/defaults here, externalized for clarity
const VETO_CONFIG_DEFAULTS = {
    high_trigger_threshold: 3, // Default weight/count
    vector_definitions: {}     // Ensure this is present for safe iteration
};

// Define the interface for the injected utility
type ConfigUtility = { 
    execute: (args: { key: string, data?: object, defaults?: object, normalize?: boolean, clear?: boolean }) => any 
};

class VetoConfigLoaderService {
    // The injected utility instance
    private configManager: ConfigUtility;
    private assetId: string;

    // The utility dependency must be passed to the constructor
    constructor(options = {}, configManagerTool: ConfigUtility) {
        this.assetId = options.assetId || 'default';
        this.configManager = configManagerTool;

        if (!this.configManager) {
            throw new Error("Config Manager Utility dependency is missing.");
        }
    }

    /**
     * Loads the raw configuration data from disk (I/O).
     * Uses synchronous read consistent with the original implementation.
     * @private
     * @returns {object} The raw configuration data.
     */
    private loadRawConfig(): object {
        const absolutePath = path.resolve(__dirname, DEFAULT_CONFIG_PATH);
        try {
             const fileContent = fs.readFileSync(absolutePath, 'utf8');
             return JSON.parse(fileContent);
        } catch (e) {
            // Re-throw specific I/O or JSON parsing errors
            throw new Error(`Failed to read/parse configuration file: ${e.message}`);
        }
    }

    /**
     * Dynamically loads the VETO triggers for the configured asset/environment.
     * @returns {Promise<object>} The loaded and validated configuration.
     */
    async loadVetoTriggers(): Promise<object> {
        const cacheKey = this.assetId;
        
        try {
            // 1. Check cache using the utility
            const cachedConfig = this.configManager.execute({ key: cacheKey });
            if (cachedConfig) {
                return cachedConfig;
            }

            // 2. Load Raw Data
            const configData = this.loadRawConfig();
            
            // 3. Apply normalization and cache the result using the utility
            const normalizedConfig = this.configManager.execute({ 
                key: cacheKey, 
                data: configData, 
                defaults: VETO_CONFIG_DEFAULTS,
                normalize: true 
            });

            return normalizedConfig;

        } catch (error) {
            console.error(`Error loading Veto Triggers for ${this.assetId}:`, error.message);
            
            // Fail-safe: Return a structure that prevents runtime crashes in evaluation services.
            return { vector_definitions: {} }; 
        }
    }

    /**
     * Clears the configuration cache for a specific asset (useful for runtime updates).
     * @param {string} key
     */
    clearCache(key = this.assetId): void {
        // Use the utility to clear the cache
        this.configManager.execute({ key, clear: true });
    }
}

export default VetoConfigLoaderService;
