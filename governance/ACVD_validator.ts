import { ACVD_SCHEMA } from './ACVD_schema.json';
import Ajv, { ErrorObject } from 'ajv';
import { ALGORITHM, canonicalStringify } from '../config/crypto_standards';
// Assuming the plugin is imported from a utility folder
import { IntegrityHasher, CryptoHashUtility } from './utilities/IntegrityHasher'; 

// --- Types ---
export interface ACVDRecord {
    ACVD_ID: string;
    context_hash: string;
    [key: string]: any; 
}

export interface ValidationResult {
    isValid: boolean;
    errors: { message: string; details?: any }[] | null;
}

// --- Constants and Setup ---
const ajv = new Ajv({ allErrors: true, useDefaults: true });
const validateSchema = ajv.compile(ACVD_SCHEMA);

// Initialize the Hashing Utility, injecting dependencies
const hasher: IntegrityHasher = new CryptoHashUtility(ALGORITHM, canonicalStringify);

/**
 * Validates an ACVD record against the canonical schema and performs cryptographic integrity checks.
 * @param record The ACVD object to validate.
 * @param inputContext The actual system context snapshot used to generate the context_hash.
 * @returns Validation results.
 */
export function validateACVD(record: ACVDRecord, inputContext: string): ValidationResult {
    const errors: { message: string; details?: any }[] = [];

    // 1. Structural Validation
    const isValidStructure = validateSchema(record);
    if (!isValidStructure) {
        if (validateSchema.errors) {
            errors.push({
                message: 'ACVD structure failed validation against canonical schema.',
                details: validateSchema.errors as ErrorObject[]
            });
        }
    }

    // 2. Context Hash Integrity Check
    const computedContextHash = hasher.createIntegrityHash(inputContext);
    if (computedContextHash !== record.context_hash) {
        errors.push({
            message: `Context hash mismatch. Input context appears tampered or incorrectly hashed.`,
            details: { expected: computedContextHash, found: record.context_hash, check: 'context_hash' }
        });
    }

    // 3. ACVD_ID Calculation Check
    // Use object destructuring to safely exclude ACVD_ID for content hashing.
    const { ACVD_ID, ...recordForHashing } = record;
    
    // Hash the rest of the record using canonical stringification
    const expectedACVDId = hasher.createIntegrityHash(recordForHashing);

    if (expectedACVDId !== ACVD_ID) {
        errors.push({
            message: `ACVD_ID integrity check failed. The record content hash does not match the stored ID.`,
            details: { expected: expectedACVDId, found: ACVD_ID, check: 'ACVD_ID' }
        });
    }
    
    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    return { isValid: true, errors: null };
}