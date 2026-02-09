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
        
        // Meta-Reasoning: Persistent tracking of validation failures for pattern recognition
        this.failureHistory = []; 
        this.MAX_HISTORY = 100; // Store the last 100 failures
        
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
     * Internal method to log validation failures for Meta-Reasoning analysis.
     */
    _trackFailure(schemaName, errors, isCritical) {
        const timestamp = Date.now();
        const summary = errors.map(e => ({
            path: e.instancePath || e.dataPath || 'N/A',
            keyword: e.keyword,
            message: e.message
        }));
        
        const failureEntry = {
            timestamp,
            schemaName,
            isCritical, // Critical (throw) or Soft (tryValidate)
            summary,
            count: errors.length
        };
        
        this.failureHistory.unshift(failureEntry);
        // Maintain fixed size history
        if (this.failureHistory.length > this.MAX_HISTORY) {
            this.failureHistory.pop();
        }
        
        // Console log only critical failures to maintain clean operational trace
        if (isCritical) {
             console.error(`[KERNEL_VALIDATION_CRITICAL]: Schema=${schemaName}, Errors=${errors.length}, KeyPath=${summary[0].path}`);
        }
    }

    /**
     * Provides the recent failure history to the Nexus-Database/kernel for strategy optimization (Meta-Reasoning).
     * @returns {Array<object>} Recent validation failure records.
     */
    getFailureHistory() {
        return this.failureHistory;
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
            // Meta-Reasoning: Track critical failure
            this._trackFailure(schemaName, validateFn.errors, true); 
            
            // Error Handling: Throw custom error 
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
        // Using structured clone or a robust utility is ideal, but JSON deep copy is used here for simplicity within file context.
        let dataCopy;
        try {
            dataCopy = JSON.parse(JSON.stringify(data));
        } catch (e) {
            console.warn(`[SCHEMA_ENGINE]: Data serialization failed during tryValidate: ${e.message}`);
            return null; // Cannot proceed if data is not serializable
        }
        
        const valid = validateFn(dataCopy);
        
        if (!valid) {
            // Meta-Reasoning: Track soft failure
            this._trackFailure(schemaName, validateFn.errors, false);
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
