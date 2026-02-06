/**
 * @module DataTransformer
 * @description Centralized utility for validating, decoding, and standardizing raw data 
 * retrieved from various sources based on primitive definitions. Also enforces security requirements.
 */
import Logger from '../utility/Logger.js';

class DataTransformer {
    constructor() {
        // Assume Logger is available and correctly initialized
        this.logger = Logger.module('DataTransformer');
    }

    /**
     * Transforms raw data according to the source configuration.
     * Includes security validation and format decoding.
     * @param {any} rawData - The unprocessed data retrieved by a handler.
     * @param {object} sourceConfig - The configuration object for the data primitive.
     * @returns {any} The finalized, validated data payload.
     */
    transform(rawData, sourceConfig) {
        const { encoding_format, security_level, primitive_type } = sourceConfig;
        
        // 1. Mandatory Security Verification
        if (!this.verifySecurity(rawData, security_level)) {
             throw new Error(`Security validation failed for ${sourceConfig.key}`);
        }

        let decodedData;

        // 2. Decoding
        switch (encoding_format.toUpperCase()) {
            case 'JSON':
                decodedData = (typeof rawData === 'string') ? JSON.parse(rawData) : rawData;
                break;
            case 'PLAINTEXT':
                decodedData = rawData; 
                break;
            // Add more encoding handlers (e.g., BINARY, PROTOBUF)
            default:
                this.logger.warn(`Unsupported encoding format ${encoding_format}. Passing raw data.`);
                decodedData = rawData;
        }

        // 3. Type/Schema Validation
        if (!this.isValidType(decodedData, primitive_type)) {
             this.logger.error(`Schema validation failed for expected type: ${primitive_type}`);
             throw new Error('Data schema validation failed after decoding.');
        }

        return decodedData;
    }

    /**
     * Placeholder method for actual security checks (e.g., integrity, authorization).
     */
    verifySecurity(data, requiredLevel) {
        // Logic hooks for checking signatures, access tokens, etc.
        // If data requires HIGH security, specialized checks might run.
        return true; 
    }
    
    /**
     * Placeholder method for actual type/schema enforcement.
     */
    isValidType(data, expectedType) {
        // In a real system, this would use a schema validation library (Zod, Joi, etc.)
        return data !== null && data !== undefined;
    }
}

export default new DataTransformer();
