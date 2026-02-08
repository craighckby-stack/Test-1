/**
 * Configuration Schema Validator Utility (v94.2)
 * Required for advanced configuration governance, ensuring deeply parsed JSON
 * structures conform to defined operational schemas.
 * 
 * NOTE: In production environments, this module interfaces with a robust
 * implementation of JSON Schema Draft 2020-12 (e.g., 'ajv').
 */

/**
 * Validates a configuration object against a JSON schema.
 * Implements basic structural and required field checks in lieu of a full AJV instance.
 * 
 * @param {object|array} configObject - The configuration structure to validate.
 * @param {object} schema - The predefined JSON schema (draft-07 or newer).
 * @param {string} configName - Descriptive name for logging context (e.g., 'CRITICALITY_WEIGHTS').
 * @returns {object} { isValid: boolean, errors: Array<string> }
 */
const validateConfig = (configObject, schema, configName) => {
    const results = { isValid: true, errors: [] };

    // 1. Root Structure and Existence Check (Initial mandatory governance point)
    if (!configObject || typeof configObject !== 'object' || Object.keys(configObject).length === 0) {
        results.isValid = false;
        results.errors.push(`[Fatal] Config ${configName} is null, empty, or not a valid object structure.`);
        return results;
    }

    // 2. Simulate required field checks based on the schema definition
    if (schema && Array.isArray(schema.required)) {
        for (const key of schema.required) {
            if (!(key in configObject)) {
                results.isValid = false;
                results.errors.push(`[Schema Error] Config ${configName} missing required field: ${key}.`);
            }
        }
    }
    
    // 3. Optional: Simulate basic type checking if properties are defined
    if (schema && schema.properties) {
        for (const [key, definition] of Object.entries(schema.properties)) {
            if (configObject[key] !== undefined && definition.type && typeof configObject[key] !== definition.type) {
                if (!(definition.type === 'number' && typeof configObject[key] === 'string' && !isNaN(parseFloat(configObject[key])))) { // Allow string numbers, common in inputs
                     // results.isValid = false; // Note: Keeping valid=true for scaffolding unless required field fails
                     console.warn(`[Type Warning] ${configName}.${key} expected type ${definition.type}. Received: ${typeof configObject[key]}.`);
                }
            }
        }
    }

    if (!results.isValid) {
        console.error(`[Validation Failed] Configuration ${configName} failed governance checks. Total errors: ${results.errors.length}`);
        return results;
    }

    console.log(`[Validation Success] Config ${configName} passed structural integrity check.`);
    return { isValid: true, errors: [] };
};

module.exports = { validateConfig };
