// src/core/conceptValidator.js

import { CONCEPT_REGISTRY } from './conceptRegistry.js';
import * as fs from 'fs'; // Mocking filesystem access for validation

/**
 * @fileoverview Utility class for validating references to core AGI and Architectural Concepts
 * and ensuring their associated implementation files exist as defined in the registry.
 * This prevents brittle self-modification (AGI-C-04) by verifying foundational references.
 */

export class ConceptValidator {
    /**
     * Checks if a given concept ID exists in the registry.
     * @param {string} conceptId - The ID to validate.
     * @returns {boolean}
     */
    static isValidConceptId(conceptId) {
        return !!CONCEPT_REGISTRY[conceptId];
    }

    /**
     * Checks if the concept is expected to have a dedicated implementation file,
     * and if that file currently exists in the codebase (simulated).
     * @param {string} conceptId - The ID of the concept.
     * @returns {{ valid: boolean, path: string|null, reason: string }}
     */
    static validateImplementation(conceptId) {
        const concept = CONCEPT_REGISTRY[conceptId];

        if (!concept) {
            return { valid: false, path: null, reason: `Concept ID ${conceptId} not found in registry.` };
        }

        const path = concept.implementationPath;

        if (!path) {
            return { valid: true, path: null, reason: `Concept ${conceptId} (${concept.name}) is fundamental/philosophical and requires no single dedicated implementation file.` };
        }

        // NOTE: In a production Sovereign AGI, fs.existsSync should be replaced
        // with a call to the Codebase Interface (AGI-C-06) for file verification.
        if (typeof fs.existsSync === 'function' && !fs.existsSync(path)) {
            return { valid: false, path, reason: `Concept implementation defined at ${path} is missing from the codebase.` };
        }

        return { valid: true, path, reason: `Implementation path verified at ${path}.` };
    }
}