/**
 * Standardized function to transform validation library errors (e.g., Ajv errors) 
 * into the system's internal structured error format.
 * 
 * This function delegates the mapping logic to the reusable SchemaErrorFormatterTool.
 * 
 * @param {Array<object>} rawErrors - Array of errors returned by the validation library.
 * @returns {Array<{path: string, message: string, keyword: string, params: object, schemaPath: string}>}
 */
const { format: formatValidationError } = require('SchemaErrorFormatterTool');

module.exports = { formatValidationError };
