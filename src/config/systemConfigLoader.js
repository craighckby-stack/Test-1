import * as path from 'path';
import { SecureConfigProvider } from '../utils/secureConfigProvider.js';
import { ConfigNormalizationAndTransformationUtility } from '../plugins/ConfigNormalizationAndTransformationUtility.js';

/**
 * Responsible for loading, decrypting, and providing the finalized application configuration.
 * Assumes encrypted secrets are stored in a designated configuration file structure.
 */
export class SystemConfigLoader {

    static CONFIG_FILE_PATH = path.resolve(process.cwd(), 'config', 'runtime.encrypted.json');

    /**
     * Defines the transformation logic for configuration fields (i.e., decryption).
     * @param {string} key - The configuration key.
     * @param {*} value - The raw configuration value.
     * @returns {*} The transformed value (decrypted or original).
     */
    static decryptTransformer(key, value) {
        // Simple decryption logic: If the value is a string and contains a colon, attempt decryption.
        
        if (typeof value === 'string' && value.includes(':')) {
            // SecureConfigProvider handles decryption and automatic JSON parsing if content is JSON
            // Failures here will be caught and re-thrown by the utility.
            return SecureConfigProvider.getSecret(value);
        }
        
        // Non-secret or pre-parsed value
        return value;
    }

    /**
     * Loads and decrypts the primary configuration file using the transformation utility.
     * @returns {Object} The fully configured and decrypted system configuration object.
     */
    static async loadConfig() {
        console.log(`Attempting to load configuration from ${SystemConfigLoader.CONFIG_FILE_PATH}`);

        try {
            const config = ConfigNormalizationAndTransformationUtility.execute({
                filePath: SystemConfigLoader.CONFIG_FILE_PATH,
                transformer: SystemConfigLoader.decryptTransformer
            });
            
            console.log('System configuration loaded and secrets successfully decrypted.');
            return config;

        } catch (e) {
            // The utility handles file not found and transformation errors, ensuring structured error reporting.
            console.error(e.message);
            throw e; 
        }
    }
}