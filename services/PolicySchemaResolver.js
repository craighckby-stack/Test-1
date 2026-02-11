/**
 * PolicySchemaResolver (v94.3)
 * Service responsible for taking an Artifact Indexing Policy (AIP)
 * and extracting/normalizing the required JSON Schema components (Base Schema and Custom Fragment).
 * This decouples schema definition resolution from the merging and validation steps, adhering to SRP.
 */

/**
 * @typedef {import('./path-to-plugin').PolicyResolutionResult} PolicyResolutionResult
 * @typedef {import('./path-to-plugin').PolicySchemaExtractorTool} PolicySchemaExtractorTool
 */

class PolicySchemaResolver {
  /**
   * @private
   * @type {PolicySchemaExtractorTool}
   */
  #extractor;

  /**
   * @param {PolicySchemaExtractorTool} extractor 
   */
  constructor(extractor) {
    this.#extractor = extractor;
  }

  /**
   * Resolves schema components from a full Artifact Indexing Policy object using the configured extractor tool.
   * @param {object} policy - The full AIP object.
   * @returns {PolicyResolutionResult}
   */
  resolveSchemaComponents(policy) {
    // Delegate the entire structural extraction and initial validation process to the specialized tool.
    return this.#extractor.resolve(policy);
  }
}

module.exports = PolicySchemaResolver;