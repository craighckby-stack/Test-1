import * as path from 'path';
import { ConfigNormalizationAndTransformationUtility } from '../plugins/ConfigNormalizationAndTransformationUtility.js';
import { SecureValueTransformer } from '../plugins/SecureValueTransformer.js';

/**
 * Responsible for loading, decrypting, and providing the finalized application configuration.
 * Assumes encrypted secrets are stored in a designated configuration file structure.
 */
export class SystemConfigLoader {

    static CONFIG_FILE_PATH = path.resolve(process.cwd(), 'config', 'runtime.encrypted.json');

    /**
     * Loads and decrypts the primary configuration file using the transformation utility.
     * It applies the SecureValueTransformer to handle decryption of marked fields.
     * @returns {Object} The fully configured and decrypted system configuration object.
     */
    static async loadConfig() {
        console.log(`Attempting to load configuration from ${SystemConfigLoader.CONFIG_FILE_PATH}`);

        try {
            const config = ConfigNormalizationAndTransformationUtility.execute({
                filePath: SystemConfigLoader.CONFIG_FILE_PATH,
                transformer: SecureValueTransformer.transform
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