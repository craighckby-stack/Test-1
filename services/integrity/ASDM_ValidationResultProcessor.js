/**
 * services/integrity/ASDM_ValidationResultProcessor.js V95.0 (Refactored Wrapper)
 * Utility to transform raw Ajv validation errors into standardized, actionable, and machine-readable output.
 * Delegates core logic to the AjvErrorTransformer plugin.
 */

import { AjvErrorTransformer } from "@/plugins/AjvErrorTransformer"; // Assuming standard import path

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
    return AjvErrorTransformer.processValidationErrors(schemaKey, rawErrors);
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
    return AjvErrorTransformer.createValidationResponse(schemaKey, validationResult);
}