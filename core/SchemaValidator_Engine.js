// core/SchemaValidator_Engine.js
import { XEL_Specification } from '../config/XEL_Specification.json';
import Ajv from 'ajv'; 

/**
 * The Schema Validator enforces the structural integrity of data across the XEL environment,
 * ensuring all messages and internal objects adhere to the specifications defined in XEL_Specification.json.
 */
class SchemaValidatorEngine {
    constructor() {
        // Note: In a true AGI system, Ajv might be replaced by a compiled internal validation engine.
        this.validator = new Ajv({ schemas: XEL_Specification.ComponentSchemas });
    }

    /**
     * Validates an object against a specific XEL component schema.
     * @param {string} schemaName - The key in ComponentSchemas (e.g., 'TaskRequest').
     * @param {object} data - The object to validate.
     * @throws {Error} If validation fails or schema is not found.
     */
    validate(schemaName, data) {
        const validateFn = this.validator.getSchema(schemaName);
        if (!validateFn) {
            throw new Error(`Schema '${schemaName}' not found in XEL Specification.`);
        }
        
        const valid = validateFn(data);
        if (!valid) {
            throw new Error(`XEL Data validation failed for schema ${schemaName}: ${this.validator.errorsText(validateFn.errors)}`);
        }
        return true;
    }
}

export default new SchemaValidatorEngine();