/**
 * ASDM_SchemaValidator V2.1
 * Autonomous utility module for validating artifacts against the ASDM schemas.
 * Ensures cryptographic commitments comply with current versioned formats.
 * Refactored to utilize the JsonSchemaService plugin for lifecycle management.
 */

import ASDM_Schemas from '../../config/ASDM_ArtifactSchemas.json';
// Assume JsonSchemaService is available via kernel injection or import path
import { JsonSchemaService } from 'AGI-KERNEL/plugins/JsonSchemaService'; 

// Define the type expected for a custom format checker function (input is typically 'unknown' from the validator engine)
type FormatChecker = (data: unknown) => boolean;

// --- 1. Custom Format Definition ---
const ASDM_CustomFormats: Record<string, FormatChecker> = {
    // Ensures string data is hex, and at least 256 bits long (64 chars)
    'hash_256+': (data) => typeof data === 'string' && data.length >= 64 && /^[0-9a-fA-F]+$/.test(data),
    
    // Ensures numerical data is an integer timestamp after a reasonable system epoch (Jan 1, 2021)
    'epoch_milliseconds': (data) => typeof data === 'number' && Number.isInteger(data) && data > 1609459200000,
    
    // Basic check for ASDM Identifier string length
    'ASDM_ID': (data) => typeof data === 'string' && data.length > 10,
};

// --- 2. Initialize the service instance ---
const ASDM_ValidatorService = new JsonSchemaService({
    schemas: ASDM_Schemas,
    customFormats: ASDM_CustomFormats
});


export const ASDM_SchemaValidator = {
    /**
     * Validates a given data object against a specified ASDM schema key.
     * @param {string} schemaKey - The key corresponding to the desired schema.
     * @param {object} data - The artifact object to validate.
     * @returns {{isValid: boolean, errors: Array<object>|null}}
     */
    validateArtifact(schemaKey: string, data: object): { isValid: boolean, errors: Array<object> | null } {
        // All initialization, compilation, execution, and standard error mapping is delegated to the service plugin.
        return ASDM_ValidatorService.validateArtifact(schemaKey, data);
    }
};