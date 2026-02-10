/**
 * ArtifactValidator.js
 * Provides logic for recursively comparing the generated artifact structure
 * against the required ArtifactStructuralDefinition schema.
 */

// We rely on the external tool for the actual logic and error definitions.
const ARTIFACT_ERRORS = ArtifactStructureValidatorTool.ARTIFACT_ERRORS;

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
    // Delegate the complex recursive validation and content checks to the tool.
    return ArtifactStructureValidatorTool.execute({
      definitionStructure,
      runtimeArtifact,
      contentValidatorRegistry: this.contentValidatorRegistry
    });
  }
}

ArtifactValidator.ARTIFACT_ERRORS = ARTIFACT_ERRORS;

module.exports = ArtifactValidator;