// core/SchemaValidator_Engine.js
import { XEL_Specification } from '../config/XEL_Specification.json';
import Ajv from 'ajv'; 

/**
 * Custom error class for structured, machine-readable validation failures.
 */
class SchemaValidationError extends Error {
    constructor(schemaName, errors) {
        // Use a temporary Ajv instance to access the errorsText utility cleanly
        const tempAjv = new Ajv();
        const errorText = tempAjv.errorsText(errors, { separator: '; ', dataVar: schemaName });
        
        super(`XEL Validation Failed [${schemaName}]: ${errorText}`);
        this.name = 'SchemaValidationError';
        this.schemaName = schemaName;
        this.validationErrors = errors; // Raw Ajv errors for programmatic handling
        
        // Improvement for Meta-Reasoning: Log basic failure signature for pattern tracking
        const firstErrorPath = errors[0]?.instancePath || errors[0]?.dataPath || 'N/A';
        console.error(`[KERNEL_VALIDATION_FAILURE_TRACE]: Schema=${schemaName}, Errors=${errors.length}, KeyPath=${firstErrorPath}`);
    }
}

/**
 * The Schema Validator enforces the structural integrity of data across the XEL environment.
 * It is designed for robustness (Error Handling) and dynamic updates (Autonomy).
 */
class SchemaValidatorEngine {
    constructor() {
        this.validator = null;
        this.SchemaValidationError = SchemaValidationError;
        // Initialize validator with imported specification
        this.initializeValidator(XEL_Specification.ComponentSchemas);
    }

    /**
     * Initializes or re-initializes the Ajv instance. This supports dynamic schema updates
     * when the AGI kernel autonomously modifies configuration files (Autonomy/Infrastructure).
     * @param {object} componentSchemas - Map of schema names to JSON Schema definitions.
     */
    initializeValidator(componentSchemas) {
        // Configuration for maximum robustness and data hygiene:
        // - allErrors: Collects all issues.
        // - strict: Ensures the schemas themselves are valid.
        // - removeAdditional: Strips extraneous properties, ensuring cleaner data flow (JSON Parsing).
        this.validator = new Ajv({
            allErrors: true,
            strict: true,
            removeAdditional: 'all' 
        });

        // Add all schemas dynamically
        if (componentSchemas) {
            Object.entries(componentSchemas).forEach(([name, schema]) => {
                try {
                    this.validator.addSchema(schema, name);
                } catch (e) {
                    // Log schema registration failure, but continue initialization
                    console.error(`[SCHEMA_ENGINE]: Failed to register schema ${name}:`, e.message);
                }
            });
        }
    }

    /**
     * Public method to manually trigger a schema refresh, allowing the kernel
     * to update specifications without a full reboot (Autonomy).
     * @param {object} newSpecification - The new ComponentSchemas object.
     */
    refreshSchemas(newSpecification) {
        // Clear old instance and re-initialize
        this.initializeValidator(newSpecification);
    }

    /**
     * Validates an object against a specific XEL component schema (Strict Mode).
     * @param {string} schemaName - The key in ComponentSchemas (e.g., 'TaskRequest').
     * @param {object} data - The object to validate (will be modified if removeAdditional is active).
     * @throws {SchemaValidationError} If validation fails.
     */
    validate(schemaName, data) {
        const validateFn = this.validator.getSchema(schemaName);
        
        if (!validateFn) {
            throw new Error(`Configuration Error: Schema '${schemaName}' not registered in the Validator.`);
        }
        
        const valid = validateFn(data); // Data is potentially mutated here (clean up)
        
        if (!valid) {
            // Error Handling: Throw custom error with integrated logging of failure pattern
            throw new this.SchemaValidationError(schemaName, validateFn.errors);
        }
        
        // Return the validated and cleaned data structure
        return data;
    }
    
    /**
     * Performs a soft validation, returning the validated data or null on failure.
     * Useful for robust JSON Parsing recovery logic where a hard crash is undesirable.
     * @param {string} schemaName 
     * @param {object} data 
     * @returns {object|null} Validated and cleaned data if successful, null otherwise.
     */
    tryValidate(schemaName, data) {
        const validateFn = this.validator.getSchema(schemaName);
        if (!validateFn) return null; 
        
        // Deep copy needed for try mode, as Ajv mutates the input object when removeAdditional is used.
        let dataCopy;
        try {
            dataCopy = JSON.parse(JSON.stringify(data));
        } catch (e) {
            console.error(`[SCHEMA_ENGINE]: Failed to copy data for soft validation: ${e.message}`);
            return null; // Cannot proceed if data is not serializable
        }
        
        const valid = validateFn(dataCopy);
        
        if (!valid) {
            // Log warning but do not throw, aiding fault tolerance (Error Handling)
            // The SchemaValidationError constructor is not called here to avoid throwing.
            return null;
        }
        
        return dataCopy;
    }
    
    /**
     * Returns the custom structured error class for external use/catching.
     * @returns {SchemaValidationError}
     */
    getValidationErrorClass() {
        return this.SchemaValidationError;
    }
}

export { SchemaValidatorEngine, SchemaValidationError };
export default new SchemaValidatorEngine();
