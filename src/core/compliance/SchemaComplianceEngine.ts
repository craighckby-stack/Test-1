import { promises as fs } from 'fs';
import * as path from 'path';

// External dependencies resolved via the kernel/module system.
// We import them for TypeScript definition purposes.
import { DataDecoderUtility } from '../utils/DataDecoderUtility'; 
import { SchemaCompilationAndValidationService } from '../validation/SchemaCompilationAndValidationService';
import { SchemaErrorFormatterTool } from '../utils/SchemaErrorFormatterTool';

// Defines the expected structure for validation results returned by the service.
interface ValidationResult {
    isValid: boolean;
    // Errors are typically complex objects (e.g., AJV validation errors)
    errors: any[]; 
}

// Define the static location of the compliance schema.
const SCHEMA_PATH = path.join(__dirname, '../../../config/SPDM_Schema.json');
const SCHEMA_FILE_NAME = path.basename(SCHEMA_PATH);
const LOG_PREFIX = '[SCE]';

/**
 * The SchemaComplianceEngine is responsible for managing the loading, registration,
 * and orchestration of configuration validation against a specific compliance schema
 * (SPDM_Schema.json). It delegates core functions to utility services.
 */
export class SchemaComplianceEngine {
    private schema: any | null = null;
    private schemaId: string | undefined;
    private isSchemaLoaded = false;

    constructor() {
        // Initialization involves setting up state, no heavy lifting done here.
    }

    /**
     * Loads the schema content from disk, parses it, and registers it with the
     * compilation/validation service for caching and use.
     * 
     * @throws Error if file loading or parsing fails, or if the schema is malformed.
     */
    public async loadSchema(): Promise<void> {
        if (this.isSchemaLoaded && this.schema) {
            console.log(`${LOG_PREFIX} Schema already loaded: ${this.schema.title || SCHEMA_FILE_NAME}`);
            return;
        }

        console.log(`${LOG_PREFIX} Attempting to load schema from: ${SCHEMA_PATH}`);

        try {
            const schemaContent = await fs.readFile(SCHEMA_PATH, 'utf-8');
            
            // 1. Safe JSON parsing
            const parsedSchema = DataDecoderUtility.decodeJson(schemaContent);
            
            if (!parsedSchema || typeof parsedSchema.$id !== 'string') {
                 throw new Error(`Invalid schema structure for ${SCHEMA_FILE_NAME}: missing required '$id' field or empty content.`);
            }

            this.schema = parsedSchema;
            this.schemaId = this.schema.$id;
            
            // 2. Register the schema with the validation service
            SchemaCompilationAndValidationService.registerSchema(this.schemaId, this.schema);

            this.isSchemaLoaded = true;
            console.log(`${LOG_PREFIX} Success: Registered schema "${this.schema.title || this.schemaId}" (ID: ${this.schemaId}).`);

        } catch (error) {
            const errMessage = (error as Error).message;
            // Log the detailed operational failure using a consistent prefix
            console.error(`${LOG_PREFIX} FATAL Error during schema loading (${SCHEMA_FILE_NAME}): ${errMessage}`);
            
            // Throw a concise error for upstream control flow handling
            throw new Error(`Compliance schema initialization failed.`);
        }
    }

    /**
     * Validates configuration data against the loaded compliance schema.
     * 
     * @param configPath The path/identifier of the configuration being validated (for logging).
     * @param configData The configuration object to validate.
     * @returns True if the configuration is valid, false otherwise.
     * @throws Error if the schema has not been successfully loaded prior to validation.
     */
    public validateConfig(configPath: string, configData: any): boolean {
        if (!this.isSchemaLoaded || !this.schemaId) {
            throw new Error('Compliance schema not loaded. Call loadSchema() first.');
        }
        
        // Delegate validation execution to the dedicated service using the cached schema ID.
        const validationResult: ValidationResult = SchemaCompilationAndValidationService.validateAgainstSchema(
            this.schemaId!,
            configData
        );
        
        const isValid = validationResult.isValid;

        if (!isValid) {
            console.error(`
${LOG_PREFIX} VALIDATION FAILURE: Configuration file failed SPDM schema validation: ${configPath}`);
            
            // Use dedicated tool to standardize and display validation errors
            const formattedErrors = SchemaErrorFormatterTool.formatErrors(validationResult.errors);
            console.error(formattedErrors);
            console.error(`------------------------------------------------------------------
`);
        }
        return isValid;
    }
}