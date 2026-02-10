import { promises as fs } from 'fs';
import * as path from 'path';

// Assuming SchemaCompilationAndValidationService and DataDecoderUtility are available via plugin infrastructure
// We import them conceptually for TypeScript typing, but they are resolved at runtime via the kernel.
import { DataDecoderUtility } from '../utils/DataDecoderUtility'; 
import { SchemaCompilationAndValidationService } from '../validation/SchemaCompilationAndValidationService';
import { SchemaErrorFormatterTool } from '../utils/SchemaErrorFormatterTool';

const SCHEMA_PATH = path.join(__dirname, '../../../config/SPDM_Schema.json');

interface ValidationResult {
    isValid: boolean;
    errors: any[];
}

/**
 * Orchestrates schema loading from the file system and uses the SchemaCompilationAndValidationService
 * for performing the actual validation against cached schemas.
 */
export class SchemaComplianceEngine {
    private schema: any | null = null;
    private schemaId: string | undefined;

    constructor() {
        // Initialization relies on external tools. No AJV instantiation required here.
    }

    /**
     * Loads the schema content from disk and parses it using a safe decoder utility.
     */
    public async loadSchema(): Promise<void> {
        if (this.schema) {
            console.log(`[Compliance] Schema already loaded: ${this.schema.title}`);
            return;
        }

        try {
            const schemaContent = await fs.readFile(SCHEMA_PATH, 'utf-8');
            
            // Use DataDecoderUtility to safely parse JSON content, replacing direct JSON.parse
            this.schema = DataDecoderUtility.decodeJson(schemaContent);
            
            if (!this.schema || typeof this.schema.$id !== 'string') {
                 throw new Error("Invalid schema structure: missing required '$id' field.");
            }
            this.schemaId = this.schema.$id;
            
            // Optional: Explicitly register the schema for compilation/caching in the service
            SchemaCompilationAndValidationService.registerSchema(this.schemaId, this.schema);

            console.log(`[Compliance] Loaded schema: ${this.schema.title}`);
        } catch (error) {
            console.error(`Failed to load or parse schema from ${SCHEMA_PATH}:`, error);
            throw new Error(`Schema loading failed.`);
        }
    }

    /**
     * Validates configuration data against the loaded schema using the dedicated validation service.
     * @param configPath The path of the configuration file being validated.
     * @param configData The configuration object to validate.
     * @returns True if the configuration is valid, false otherwise.
     */
    public validateConfig(configPath: string, configData: any): boolean {
        if (!this.schema || !this.schemaId) {
            throw new Error('Schema not loaded. Call loadSchema() first.');
        }
        
        // Delegate validation execution to the dedicated service.
        const validationResult: ValidationResult = SchemaCompilationAndValidationService.validateAgainstSchema(
            this.schemaId, 
            configData
        );
        
        const isValid = validationResult.isValid;

        if (!isValid) {
            console.error(`[Compliance Failure] Config failed validation: ${configPath}`);
            
            // Use SchemaErrorFormatterTool to standardize and display validation errors
            const formattedErrors = SchemaErrorFormatterTool.formatErrors(validationResult.errors);
            console.error(formattedErrors);
        }
        return isValid;
    }
}