/**
 * PolicySchemaResolver (v94.3)
 * Service responsible for taking an Artifact Indexing Policy (AIP)
 * and extracting/normalizing the required JSON Schema components (Base Schema and Custom Fragment).
 * This decouples schema definition resolution from the merging and validation steps, adhering to SRP.
 */

/**
 * @typedef {object} PolicyResolutionResult
 * @property {object | null} baseSchema - The resolved core indexing schema.
 * @property {object | null} customSchemaFragment - The optional custom metadata fragment.
 * @property {string | null} coreSchemaRef - The identifier of the base schema definition.
 * @property {string | null} error - An error message if resolution failed.
 */

/**
 * @interface PolicySchemaExtractorTool
 * @property {function(object): PolicyResolutionResult} resolve - Resolves schema components from a policy.
 */

class PolicySchemaResolver {
  /**
   * @private
   * @type {PolicySchemaExtractorTool}
   */
  extractor;

  /**
   * @param {PolicySchemaExtractorTool} extractor 
   */
  constructor(extractor) {
    this.extractor = extractor;
  }

  /**
   * Resolves schema components from a full Artifact Indexing Policy object using the configured extractor tool.
   * @param {object} policy - The full AIP object.
   * @returns {PolicyResolutionResult}
   */
  resolveSchemaComponents(policy) {
    // Delegate the entire structural extraction and initial validation process to the specialized tool.
    return this.extractor.resolve(policy);
  }
}

module.exports = PolicySchemaResolver;