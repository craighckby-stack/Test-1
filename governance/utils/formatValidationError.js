const { format: formatSchemaError } = require('SchemaErrorFormatterTool');

/**
 * Standardized function to transform validation library errors (e.g., Ajv errors) 
 * into the system's internal structured error format.
 * 
 * This function now delegates the mapping logic to the reusable SchemaErrorFormatterTool.
 * 
 * @param {Array<object>} rawErrors - Array of errors returned by the validation library.
 * @returns {Array<{path: string, message: string, keyword: string, params: object, schemaPath: string}>}
 */
function formatValidationError(rawErrors = []) {
    return formatSchemaError(rawErrors);
}

module.exports = { formatValidationError };