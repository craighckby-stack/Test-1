/**
 * @module SchemaValidator
 * @description Central utility for managing and executing type and schema validation 
 * against defined data primitives via the DataSchemaValidator plugin.
 */

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Assuming the existence of a global/injected plugin mechanism (plugins)
declare var plugins: {
    DataSchemaValidator: {
        execute(args: { data: any, primitiveType: string }): ValidationResult;
    }
};

class SchemaValidator {
    constructor() {
        // No longer defines internal schemas. They are managed by the plugin.
    }

    /**
     * Retrieves a schema definition based on the primitive type identifier.
     * NOTE: Schemas are now managed externally by the DataSchemaValidator plugin.
     * This method is deprecated internally but kept for potential external compatibility.
     * @param primitiveType - The key identifier for the required schema.
     * @returns {null} Always returns null as schemas are externalized.
     */
    getSchema(primitiveType: string): null {
        // Schema introspection is handled by the plugin layer, not the core class wrapper.
        return null;
    }

    /**
     * Specialized validation for the primary LLM Evolution output structure.
     * Alias for validate(data, 'EvolutionOutput'). (Crucial for Mission Step 1)
     * @param data - The parsed JSON data from the LLM.
     * @returns {ValidationResult}
     */
    validateEvolutionOutput(data: any): ValidationResult {
        return this.validate(data, 'EvolutionOutput');
    }

    /**
     * Validates a data payload against a known schema primitive using the DataSchemaValidator plugin.
     * @param data - The decoded data payload.
     * @param primitiveType - The expected schema type identifier.
     * @returns {ValidationResult} Validation result object, including detailed errors.
     */
    validate(data: any, primitiveType: string): ValidationResult {
        // Delegate all complex validation logic to the dedicated plugin.
        if (typeof plugins !== 'undefined' && plugins.DataSchemaValidator) {
            try {
                return plugins.DataSchemaValidator.execute({
                    data: data,
                    primitiveType: primitiveType
                });
            } catch (e) {
                // Ensure graceful handling of plugin execution errors
                return { isValid: false, errors: [`DataSchemaValidator execution failed: ${e.message}`] };
            }
        }
        
        // Fallback if plugin infrastructure is missing
        return { isValid: false, errors: ["CRITICAL: DataSchemaValidator plugin is not loaded or accessible."] };
    }
}

export default new SchemaValidator();
