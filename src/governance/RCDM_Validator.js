import { HighPerformanceSchemaCacheTool } from '@plugin/HighPerformanceSchemaCacheTool'; 
import { TraceableIdGenerator } from '@plugin/TraceableIdGenerator'; // Utility for generating unique IDs
import { CanonicalHashingTool } from '@plugin/CanonicalHashingTool'; // Utility for stable data hashing

interface ValidationResult {
    valid: boolean;
    errors: any[] | null;
}

/**
 * RCDMValidator: Recursive Configuration Data Model Validator
 * Utilizes high-performance caching, lazy schema compilation, and stable hashing
 * to achieve maximum computational efficiency for governance data validation.
 * 
 * NOTE: Core schema validation, compilation, and result caching are delegated
 * to the HighPerformanceSchemaCacheTool plugin for optimal AJV-based performance.
 */
class RCDMValidator {
    private schema: object | null = null;
    private schemaId: string;
    private readonly cacheTool: HighPerformanceSchemaCacheTool;

    /**
     * Initializes the validator.
     * @param schema The schema object (can be loaded lazily later).
     */
    constructor(schema?: object) {
        // Use a stable ID based on the schema structure if provided, otherwise generate a unique instance ID.
        // Assuming CanonicalHashingTool and TraceableIdGenerator are injected or statically accessible.
        // This ensures cache integrity across service restarts.
        this.schemaId = schema 
            ? CanonicalHashingTool.hash(schema) 
            : TraceableIdGenerator.generate("RCDM_INST");
        
        this.schema = schema || null;
        // The plugin interface is initialized here, encapsulating caching and compilation logic.
        this.cacheTool = new HighPerformanceSchemaCacheTool();
    }

    /**
     * Loads the schema if it wasn't provided in the constructor (Lazy Loading).
     * This is idempotent and updates the schemaId if the new schema is different.
     * @param newSchema The JSON schema to use for validation.
     */
    public loadSchema(newSchema: object): void {
        const newSchemaId = CanonicalHashingTool.hash(newSchema);
        
        if (this.schemaId !== newSchemaId) {
            // A new schema has been loaded. Invalidate global caches associated with the old ID.
            this.cacheTool.clearCaches(); 
            this.schema = newSchema;
            this.schemaId = newSchemaId;
        }
        // If schemas match, do nothing (efficient no-op).
    }

    /**
     * Validates the input data against the current RCDM schema.
     * Leverages the cache tool for memoization and lazy compilation.
     * 
     * @param data The configuration data payload.
     * @returns ValidationResult { valid: boolean, errors: array | null }
     */
    public validate(data: any): ValidationResult {
        if (!this.schema) {
            console.error("RCDM Schema has not been loaded.");
            return { valid: false, errors: [{ message: "RCDM Schema not initialized." }] };
        }
        
        // Delegate high-performance validation, caching, and lazy compilation to the plugin.
        const result = this.cacheTool.execute({
            schemaId: this.schemaId,
            schema: this.schema,
            data: data
        });

        return result;
    }

    /**
     * Invalidates the validation results cache entirely (useful after global configuration changes).
     */
    public invalidateCache(): void {
        this.cacheTool.clearCaches();
    }
}

export { RCDMValidator };