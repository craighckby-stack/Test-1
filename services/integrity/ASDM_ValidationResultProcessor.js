/**
 * services/integrity/ASDM_ValidationResultProcessor.js V94.1 (Delegated)
 * Utility to transform raw Ajv validation errors into standardized, actionable, and machine-readable output.
 * Uses the AjvErrorTransformer plugin for core logic.
 */

// Assuming that the services layer accesses the tool functionality
// via a utility wrapper or dependency injection mechanism. This declaration
// abstracts the external interface defined in the plugin.
declare const AjvErrorTransformer: {
    processValidationErrors: (schemaKey: string, rawErrors: AjvError[]) => StandardIssue[];
    createValidationResponse: (schemaKey: string, validationResult: { isValid: boolean, errors: AjvError[] | null | undefined }) => { success: boolean, issues: StandardIssue[] };
};

/**
 * @typedef {object} AjvError
 * @property {string} keyword - The Ajv keyword (e.g., 'required', 'maxLength').
 * @property {string} instancePath - The JSON pointer path to the failed instance.
 * @property {string} [dataPath] - Deprecated path field (for compatibility).
 * @property {string} [message] - Ajv generated error message.
 * @property {object} params - Keyword specific parameters.
 */

/**
 * @typedef {object} StandardIssue
 * @property {string} schema - The key of the schema validated against.
 * @property {string} field - The canonical path of the invalid data (JSON Pointer format).
 * @property {string} code - The type of validation failure (Ajv keyword).
 * @property {string} message - A descriptive error message (usually the Ajv generated message).
 */


/**
 * Transforms Ajv errors into a standardized, minimal failure list (StandardIssue format).
 * Delegates to AjvErrorTransformer.
 *
 * @param {string} schemaKey - The key of the schema validated against.
 * @param {Array<AjvError>} rawErrors - The errors array returned by Ajv.
 * @returns {Array<StandardIssue>}
 */
export function processValidationErrors(schemaKey: string, rawErrors: AjvError[]): StandardIssue[] {
    // Delegation to the extracted plugin logic
    if (typeof AjvErrorTransformer?.processValidationErrors === 'function') {
        return AjvErrorTransformer.processValidationErrors(schemaKey, rawErrors);
    }
    
    // Safety fallback implementation
    if (!Array.isArray(rawErrors)) return [];
    
    return rawErrors.map(error => ({
        schema: schemaKey,
        field: (error as any).instancePath || (error as any).dataPath || '/', 
        code: (error as any).keyword,
        message: (error as any).message || `Validation error [${(error as any).keyword}] details unavailable`
    })) as StandardIssue[];
}

/**
 * Creates a standardized validation response object based on raw Ajv output.
 * Delegates to AjvErrorTransformer.
 * 
 * @param {string} schemaKey - The key of the schema validated against.
 * @param {{isValid: boolean, errors: Array<AjvError>|null|undefined}} validationResult
 * @returns {{success: boolean, issues: Array<StandardIssue>}}
 */
export function createValidationResponse(schemaKey: string, validationResult: {isValid: boolean, errors: AjvError[] | null | undefined}): { success: boolean, issues: StandardIssue[] } {
    // Delegation to the extracted plugin logic
    if (typeof AjvErrorTransformer?.createValidationResponse === 'function') {
        return AjvErrorTransformer.createValidationResponse(schemaKey, validationResult);
    }

    // Safety fallback implementation
    const isValid = validationResult?.isValid ?? false;
    const errors = validationResult?.errors ?? null;

    const issues = isValid 
        ? [] 
        : processValidationErrors(schemaKey, errors as AjvError[]);

    return {
        success: isValid,
        issues: issues,
    };
}