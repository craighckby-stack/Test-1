/**
 * ASDM_SchemaValidator V2.1
 * Autonomous utility module for validating artifacts against the ASDM schemas.
 * Ensures cryptographic commitments comply with current versioned formats.
 * Refactored to utilize the JsonSchemaService plugin for lifecycle management.
 */

import ASDM_Schemas from '../../config/ASDM_ArtifactSchemas.json';
// Assume JsonSchemaService is available via kernel injection or import path
import { JsonSchemaService } from 'AGI-KERNEL/plugins/JsonSchemaService'; 

// --- 1. Custom Format Definition ---
const ASDM_CustomFormats: Record<string, Function> = {
    'hash_256+': (data: string) => typeof data === 'string' && data.length >= 64 && /^[0-9a-fA-F]+$/.test(data),
    'epoch_milliseconds': (data: number) => Number.isInteger(data) && data > 1609459200000,
    'ASDM_ID': (data: string) => typeof data === 'string' && data.length > 10,
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