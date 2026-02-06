// src/core/conceptValidator.js

import { CONCEPT_REGISTRY } from './conceptRegistry.js';
import { CodebaseAccessor } from '../system/codebaseAccessor.js';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - True if the validation succeeded.
 * @property {string | null} path - The associated implementation path, if any.
 * @property {string} reason - Detailed justification for the result.
 */

/**
 * @fileoverview Utility class for validating references to core AGI and Architectural Concepts.
 * It ensures concept integrity and verifies the existence of required associated
 * implementation files using the abstracted CodebaseAccessor interface (AGI-C-06).
 * This prevents brittle self-modification by verifying foundational references.
 */

export class ConceptValidator {

    /**
     * Checks if a given concept ID exists in the registry.
     * Utilizes safer property lookup for robustness.
     * @param {string} conceptId - The ID to validate (e.g., 'AGI-C-04').
     * @returns {boolean}
     */
    static isValidConceptId(conceptId) {
        if (!conceptId || typeof conceptId !== 'string') {
             return false;
        }
        // Safer check against potential prototype pollution
        return Object.prototype.hasOwnProperty.call(CONCEPT_REGISTRY, conceptId);
    }

    /**
     * Executes deep validation for a concept: registry existence, path definition,
     * and file existence check via the CodebaseAccessor.
     * @param {string} conceptId - The ID of the concept.
     * @returns {ValidationResult}
     */
    static validateImplementation(conceptId) {
        if (!ConceptValidator.isValidConceptId(conceptId)) {
            return { valid: false, path: null, reason: `Concept ID '${conceptId}' is invalid or not found in registry.` };
        }

        const concept = CONCEPT_REGISTRY[conceptId];
        const path = concept.implementationPath;

        // Case 1: Concept is philosophical/declarative
        if (!path) {
            return {
                valid: true,
                path: null,
                reason: `Concept ${conceptId} (${concept.name}) is declarative and requires no dedicated implementation file.`
            };
        }

        // Case 2: Concrete Implementation Path Defined but missing or inaccessible
        if (!CodebaseAccessor.fileExists(path)) {
            return {
                valid: false,
                path,
                reason: `Concept implementation defined at '${path}' is missing or inaccessible via CodebaseAccessor. HIGH PRIORITY INTEGRITY VIOLATION.`
            };
        }

        // Case 3: Implementation verified
        return { valid: true, path, reason: `Implementation path verified successfully at '${path}'.` };
    }
}