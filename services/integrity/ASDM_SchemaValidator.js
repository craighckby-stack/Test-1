/**
 * ASDM_SchemaValidator V2.0
 * Autonomous utility module for validating artifacts against the ASDM schemas.
 * Ensures cryptographic commitments comply with current versioned formats.
 * Refactored to utilize the SchemaCompilerAndValidator plugin for lifecycle management.
 */

import ASDM_Schemas from '../../config/ASDM_ArtifactSchemas.json';

// We assume SchemaCompilerAndValidator is globally available or injected by the kernel runtime
declare const SchemaCompilerAndValidator: {
    initialize: (schemas: any, customFormats: Record<string, Function>) => void;
    execute: (args: { schemaKey: string, data: object }) => { isValid: boolean, errors: Array<object> | null };
};

// --- 1. Custom Format Definition ---
const ASDM_CustomFormats: Record<string, Function> = {
    'hash_256+': (data: string) => typeof data === 'string' && data.length >= 64 && /^[0-9a-fA-F]+$/.test(data),
    'epoch_milliseconds': (data: number) => Number.isInteger(data) && data > 1609459200000,
    'ASDM_ID': (data: string) => typeof data === 'string' && data.length > 10,
};

// --- 2. Schema Pre-compilation Initialization ---
function initializeValidators(): void {
    try {
        if (!ASDM_Schemas || !ASDM_Schemas.schemas || Object.keys(ASDM_Schemas.schemas).length === 0) {
            console.warn("ASDM Validator V2.0: No schemas found in ASDM_ArtifactSchemas.json.");
            return;
        }
        
        // Delegate AJV setup, format registration, and compilation to the tool
        SchemaCompilerAndValidator.initialize(ASDM_Schemas, ASDM_CustomFormats);
        console.log("ASDM Validator V2.0 initialized and schemas pre-compiled.");

    } catch (e) {
        // Critical warning: Tool failure or structural issue in schemas
        console.error(`ASDM Validator Initialization Failure: Could not initialize SchemaCompilerAndValidator.`, e);
    }
}

// Execute initialization immediately upon module load
initializeValidators();


export const ASDM_SchemaValidator = {
    /**
     * Validates a given data object against a specified ASDM schema key.
     * @param {string} schemaKey - The key corresponding to the desired schema.
     * @param {object} data - The artifact object to validate. Note: This object may be mutated if schema uses 'useDefaults: true'.
     * @returns {{isValid: boolean, errors: Array<object>|null}}
     */
    validateArtifact(schemaKey: string, data: object): { isValid: boolean, errors: Array<object> | null } {
        let result;

        try {
            result = SchemaCompilerAndValidator.execute({
                schemaKey: schemaKey,
                data: data
            });
        } catch (e) {
            // This catch block handles internal tool failures, usually related to setup.
            console.error(`Validation execution failed for ${schemaKey}:`, e);
            return { isValid: false, errors: [{ keyword: "execution_error", message: `Tool execution failed: ${e.message}` }] };
        }

        // Check for specific initialization or missing schema errors returned by the tool
        if (!result.isValid && result.errors) {
            const firstError = result.errors[0];

            if (firstError.keyword === "missing_schema") {
                // If the tool reports missing schema:
                if (ASDM_Schemas.schemas[schemaKey]) {
                    // Schema exists in config, but failed compilation earlier (logged during initialization inside the tool)
                    return { isValid: false, errors: [{ keyword: "initialization", message: `Validator failed initialization for schema key: ${schemaKey}` }] };
                } else {
                    // Schema key is completely unknown / unsupported
                    throw new Error(`Schema key not found or unsupported: ${schemaKey}`);
                }
            }
        }

        return result;
    }
};
