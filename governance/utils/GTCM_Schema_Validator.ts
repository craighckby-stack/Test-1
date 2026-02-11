import { SchemaValidatorCore, GTCMObjectSchema, IValidationResult, GTCMType, GTCMProperty } from "./plugins/SchemaValidatorCore";

/**
 * Public Validation Result Interface
 */
export type ValidationResult = IValidationResult;

// Re-export core types for consumers of this utility
export { GTCMType, GTCMProperty, GTCMObjectSchema };

/**
 * GTCM_Schema_Validator
 * Utility class providing the entry point for Governance-based data structure validation.
 * Abstraction is achieved by delegating the complex, recursive validation logic to the
 * reusable SchemaValidatorCore plugin.
 */
export class GTCM_Schema_Validator {
    
    /**
     * Validates a data structure against a defined GTCM schema.
     * This method serves as the public interface, initiating the recursive core validation.
     * @param data The data structure to validate.
     * @param schema The GTCM schema definition.
     * @returns A ValidationResult object.
     */
    public static validate(data: unknown, schema: GTCMObjectSchema): ValidationResult {
        // Start validation at the root path 'root'.
        return SchemaValidatorCore.validateRecursive(data, schema, 'root');
    }
}