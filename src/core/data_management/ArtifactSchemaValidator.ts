// src/core/data_management/ArtifactSchemaValidator.ts

import { readFileSync } from 'fs';

// Placeholder for the external Schema Validation Tool Interface
// These interfaces define the contract with the vanilla JS plugin.
interface ValidationResult {
    isValid: boolean;
    errors: Array<{ message: string, dataPath?: string }>;
    errorText?: string;
}

interface SchemaValidationTool {
    compileAndCacheSchema(schemaRef: string, schemaContent: unknown): string;
    validateData(schemaRef: string, data: unknown): ValidationResult;
}

// We assume the SchemaCompilationAndValidationService plugin is executed and available in the global scope.
const schemaValidationTool: SchemaValidationTool = (globalThis as any).SchemaCompilationAndValidationService;


/**
 * Manages dynamic loading and validation of external schemas referenced by 
 * the Data Artifact Registry (via the 'schema_ref' field).
 * 
 * This utility is critical for ensuring that structured data payloads conform 
 * to the defined governance and operational contracts at runtime.
 */
export class ArtifactSchemaValidator {
    // Tracks which schemas have been loaded from disk and compiled by the service.
    private loadedSchemaRefs: Set<string>; 
    private schemaBasePath: string;

    constructor(schemaBasePath: string = './config/schemas') {
        if (!schemaValidationTool) {
            throw new Error("SchemaCompilationAndValidationService plugin is required but not found in the execution environment.");
        }
        this.loadedSchemaRefs = new Set();
        // Ensure the path ends with a separator
        this.schemaBasePath = schemaBasePath.endsWith('/') ? schemaBasePath : `${schemaBasePath}/`;
    }

    /**
     * Loads, parses, and compiles a schema from the file system based on its reference path.
     * Caches the compilation result via the Schema Validation Tool.
     * @param schemaRef The path defined in the artifact registry (e.g., 'CORE_TRANSACTION_EVENT.json')
     */
    private ensureSchemaIsCompiled(schemaRef: string): void {
        if (this.loadedSchemaRefs.has(schemaRef)) {
            return;
        }

        const fullPath = `${this.schemaBasePath}${schemaRef}`;
        console.debug(`[ArtifactSchemaValidator] Attempting to load schema from: ${fullPath}`);

        try {
            const schemaContentString = readFileSync(fullPath, 'utf-8');
            const schema = JSON.parse(schemaContentString);
            
            // Delegate compilation and caching to the external tool
            schemaValidationTool.compileAndCacheSchema(schemaRef, schema);
            
            this.loadedSchemaRefs.add(schemaRef);

        } catch (error) {
            let errorMessage = `Failed to initialize validator for schemaRef: ${schemaRef}.`;
            
            if (error instanceof Error) {
                if (error.message.includes('ENOENT')) {
                    errorMessage += " Ensure file exists.";
                } else if (error.message.includes('JSON')) {
                    errorMessage += " Ensure file contains valid JSON Schema.";
                } else {
                    errorMessage += ` Internal tool error: ${error.message}`;
                }
            }
            console.error(`Error processing schema at ${fullPath}:`, error);
           
            throw new Error(errorMessage);
        }
    }

    /**
     * Validates a given structured data payload against the referenced artifact schema.
     * @param data The data object to validate.
     * @param schemaRef The reference key for the schema definition (e.g., 'API_RESPONSE.json').
     * @returns True if valid.
     * @throws Error if validation fails.
     */
    public validateArtifact(data: unknown, schemaRef: string): boolean {
        // 1. Ensure schema is loaded and compiled
        this.ensureSchemaIsCompiled(schemaRef);

        // 2. Delegate validation to the external tool
        const validationResult = schemaValidationTool.validateData(schemaRef, data);

        if (!validationResult.isValid) {
            // Providing clear error details from the tool
            const errorDetails = validationResult.errorText || `Unknown validation error with ${validationResult.errors.length} issues.`
            throw new Error(`Data artifact validation failed for schema '${schemaRef}'. Details: ${errorDetails}`);
        }

        return true;
    }
}