/**
 * ArtifactValidator.js
 * Provides logic for recursively comparing the generated artifact structure
 * against the required ArtifactStructuralDefinition schema.
 */

// Standardized error codes for machine readability
const ARTIFACT_ERRORS = {
  MISSING_ENTRY: 'MISSING_ENTRY',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
  UNEXPECTED_ENTRY: 'UNEXPECTED_ENTRY',
  CONTENT_VALIDATION_FAILED: 'CONTENT_VALIDATION_FAILED'
};

class ArtifactValidator {

  /**
   * @param {Object} dependencies - Optional dependencies, notably contentValidatorRegistry.
   */
  constructor({ contentValidatorRegistry } = {}) {
    // Dependency injection allows separation of structural concerns from content concerns
    this.contentValidatorRegistry = contentValidatorRegistry;
  }

  /**
   * Compares the target structure (what was generated) against the
   * required definition (what should have been generated).
   *
   * @param {Object} definitionStructure - The required structure schema (nested definition).
   * @param {Object} runtimeArtifact - The generated files/directories object (nested structure).
   * @returns {Promise<{success: boolean, errors: {code: string, path: string, message: string}[]}>}
   */
  async validate(definitionStructure, runtimeArtifact) {
    if (!definitionStructure) {
      return { success: true, errors: [] }; 
    }
    if (!runtimeArtifact) {
      return { 
        success: false, 
        errors: [{ 
          code: ARTIFACT_ERRORS.MISSING_ENTRY, 
          path: '/', 
          message: "Runtime artifact is entirely missing."
        }]
      };
    }

    const errors = [];
    await this._validateRecursive(definitionStructure, runtimeArtifact, '/', errors);

    return {
      success: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Recursive validation core logic.
   * Assumes definitionStructure nodes define `type` ('file'/'directory'), `required` (boolean),
   * and optionally `children` (for directory) or `contentValidator` (for file).
   *
   * @private
   */
  async _validateRecursive(expectedNode, actualNode, currentPath, errors) {
    // 1. Check entries required by definition
    for (const [key, expected] of Object.entries(expectedNode)) {
      // Normalize path for accurate error reporting
      const childPath = `${currentPath}${key}${expected.type === 'directory' && currentPath !== '/' ? '/' : ''}`;
      const actual = actualNode[key];

      if (expected.required && !actual) {
        errors.push({
          code: ARTIFACT_ERRORS.MISSING_ENTRY,
          path: childPath,
          message: `${expected.type === 'directory' ? 'Directory' : 'File'} required by definition is missing.`
        });
        continue; 
      }

      if (actual) {
        // Determine if the actual entry is a directory (nested object without 'content')
        const isActualDirectory = typeof actual === 'object' && actual !== null && !('content' in actual);

        if (expected.type === 'directory') {
          if (!isActualDirectory) {
             errors.push({
              code: ARTIFACT_ERRORS.TYPE_MISMATCH,
              path: childPath,
              message: `Expected directory, but found a file or malformed structure.`
            });
          } else if (expected.children) {
            // Recurse
            await this._validateRecursive(expected.children, actual, childPath, errors);
          }
        }

        if (expected.type === 'file') {
          if (isActualDirectory) {
            errors.push({
              code: ARTIFACT_ERRORS.TYPE_MISMATCH,
              path: childPath,
              message: `Expected file, but found a directory.`
            });
          } else {
            // Content Validation (if required and registry exists)
            if (expected.contentValidator && this.contentValidatorRegistry) {
              const validator = this.contentValidatorRegistry.getValidator(expected.contentValidator);
              if (validator) {
                try {
                  const content = actual.content || actual; // Handle object wrapper or direct content string
                  const validationResult = await validator.validate(content, expected.validationConfig);

                  if (!validationResult.success) {
                    errors.push({
                      code: ARTIFACT_ERRORS.CONTENT_VALIDATION_FAILED,
                      path: childPath,
                      message: `Content validation failed using '${expected.contentValidator}': ${validationResult.details.join('; ')}`
                    });
                  }
                } catch (e) {
                   errors.push({
                      code: ARTIFACT_ERRORS.CONTENT_VALIDATION_FAILED,
                      path: childPath,
                      message: `Content validator '${expected.contentValidator}' threw an exception: ${e.message}`
                    });
                }
              } // If validator is not found, skip content validation, or optionally error if configuration is strict.
            }
          }
        }
      }
    }
    // Note: Checking for unexpected files (UNEXPECTED_ENTRY) is omitted unless definition specifies 'strict: true' mode.
  }
}

ArtifactValidator.ARTIFACT_ERRORS = ARTIFACT_ERRORS;

module.exports = ArtifactValidator;