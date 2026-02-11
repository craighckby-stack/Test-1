/**
 * @file services/schema_enforcement/GsepCArtifactValidator.js
 * @description Refactored artifact validator utilizing the SchemaRecursiveValidator plugin.
 */

import { SchemaRecursiveValidator } from '../plugins/SchemaRecursiveValidator';

class GsepCArtifactValidator {
    /**
     * @param {object} [options={}] Configuration options for the underlying validator.
     */
    constructor(options = {}) {
        // Delegate complex recursive validation logic to the abstracted plugin.
        this.validator = new SchemaRecursiveValidator(options);
    }

    /**
     * Validates an artifact against a defined schema.
     * @param {object} artifact The data object to validate.
     * @param {object} schema The validation schema (e.g., JSON Schema).
     * @returns {Array<object>} An array of validation errors. Empty array if valid.
     */
    validate(artifact, schema) {
        if (!artifact || !schema) {
            return [{ message: "Artifact or schema is missing.", path: "$" }];
        }
        return this.validator.validate(artifact, schema);
    }

    /**
     * Shortcut to check if the artifact is valid (no errors).
     * @param {object} artifact
     * @param {object} schema
     * @returns {boolean}
     */
    isValid(artifact, schema) {
        return this.validate(artifact, schema).length === 0;
    }
}

export { GsepCArtifactValidator };