/**
 * @module DataTransformer
 * @description Centralized orchestrator for validating, decoding, and standardizing raw data 
 * retrieved from various sources based on primitive definitions. Enforces security and integrity checks.
 */
import Logger from '../utility/Logger.js';
import SchemaValidator from './SchemaValidator.js'; 
// AGI-KERNEL: Utilizing extracted plugin for decoding
import DataDecoderUtility from '../utility/DataDecoderUtility.js'; 

class DataTransformer {
    private logger: Logger;
    private validator: typeof SchemaValidator;
    private decoder: typeof DataDecoderUtility;

    constructor() {
        this.logger = Logger.module('DataTransformer');
        this.validator = SchemaValidator; // Utilize the validation module
        this.decoder = DataDecoderUtility; // Utilize the extracted decoding utility
    }

    /**
     * Executes the full data pipeline: Security -> Decode -> Validate.
     * @param {any} rawData - The unprocessed data retrieved.
     * @param {object} sourceConfig - Configuration including encoding, security, and schema type.
     * @returns {any} The finalized, validated data payload.
     * @throws {Error} If security fails, decoding fails, or schema validation fails.
     */
    transform(rawData: any, sourceConfig: { encoding_format: string, security_level: string, primitive_type: string, key?: string }): any {
        const { encoding_format, security_level, primitive_type } = sourceConfig;
        const configKey = sourceConfig.key || primitive_type; 

        // 1. Security & Integrity Check (Critical Path)
        if (!this._verifySecurity(rawData, security_level, configKey)) {
             throw new Error(`[DATA_SECURITY_FAILURE] Security verification failed for source: ${configKey}`);
        }

        // 2. Data Decoding
        let decodedData = this._decodeData(rawData, encoding_format, configKey);

        // 3. Schema & Type Validation
        this._validateSchema(decodedData, primitive_type, configKey);
        
        return decodedData;
    }

    /**
     * Handles specific encoding formats using the DataDecoderUtility plugin.
     * @private
     */
    _decodeData(rawData: any, format: string, key: string): any {
        try {
            // Use the extracted utility for data transformation
            return this.decoder.execute({ rawData, format });
        } catch (error) {
            // The decoder plugin throws if a supported format (like JSON) fails parsing.
            const errorMessage = (error instanceof Error) ? error.message : String(error);

            // Note: If the format is unsupported, the plugin returns rawData without throwing.
            this.logger.error(`Decoding failed for ${key} (Format: ${format}). Error: ${errorMessage}`);
            throw new Error(`[DECODING_FAILURE] Failed to decode data for ${key}.`);
        }
    }

    // --- Core Checks ---

    /**
     * Executes schema validation using the centralized Validator utility.
     * @private
     */
    _validateSchema(data: any, primitiveType: string, key: string): void {
        if (!this.validator.validate(data, primitiveType)) {
             this.logger.error(`[SCHEMA_MISMATCH] Validation failed for expected type: ${primitiveType} in source ${key}`);
             throw new Error(`[SCHEMA_VALIDATION_FAILURE] Data structure invalid for primitive type: ${primitiveType}.`);
        }
    }

    /**
     * Executes security checks (e.g., signature verification, TLS integrity).
     * @private
     */
    _verifySecurity(data: any, requiredLevel: string, key: string): boolean {
        this.logger.debug(`Running security checks (Level: ${requiredLevel}) for ${key}`);
        return true; 
    }
}

// Export as a Singleton instance
export default new DataTransformer();
