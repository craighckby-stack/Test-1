/**
 * ASDM_ErrorTranslator V1.0
 * Component responsible for converting standardized internal validation issues (StandardIssue)
 * into finalized, human-readable error messages for consumption by external APIs or UI.
 * This component now delegates core translation logic to the StructuredErrorTranslator tool.
 */

import { StructuredErrorTranslator } from './plugins';

/**
 * @typedef {object} StandardIssue
 * @property {string} schema - The key of the schema validated against.
 * @property {string} field - The canonical path of the invalid data (JSON Pointer format).
 * @property {string} code - The type of validation failure (Ajv keyword or custom code).
 * @property {string} message - The original generated error message (used as fallback).
 */

/**
 * Takes a standardized issue and formats a highly contextual message using the dedicated translation tool.
 * 
 * @param {StandardIssue} issue 
 * @param {string} [locale='en-US'] - Optional locale setting.
 * @returns {string} The final, user-ready error message.
 */
export function translateIssueToUserMessage(issue, locale = 'en-US') {
    // Delegation to the extracted plugin for standardized error formatting and path cleaning.
    return StructuredErrorTranslator.translate(issue, locale);
}

export const ASDM_ErrorTranslator = {
    translate: translateIssueToUserMessage
};
