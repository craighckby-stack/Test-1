/**
 * ArtifactDefinitionComposer.js
 * Facilitates the creation and management of complex ArtifactStructuralDefinitions
 * by allowing composition of reusable structural templates (patterns).
 * This utility delegates template management to the StructuralPatternRegistryTool.
 */

class ArtifactDefinitionComposer {

  /**
   * @param {Object} registry - The tool instance for managing structural templates. Must implement registerPattern and getPattern.
   */
  constructor(registry) {
    if (!registry || typeof registry.registerPattern !== 'function' || typeof registry.getPattern !== 'function') {
      throw new Error("StructuralPatternRegistryTool dependency must be provided and implement required methods: registerPattern(name, definition) and getPattern(name).");
    }
    this.registry = registry;
  }

  /**
   * Registers a reusable structural template.
   * Delegates storage to the registry tool.
   * @param {string} name - Template name (e.g., 'ReactComponent', 'NodeModule').
   * @param {Object} definition - The partial definition structure.
   */
  registerTemplate(name, definition) {
    // Note: Warning logic retained here as it relates to the Composer's specific registration policy
    if (this.registry.getPattern(name)) {
      console.warn(`Template '${name}' is being overwritten.`);
    }
    this.registry.registerPattern(name, definition);
  }

  /**
   * Retrieves a registered template.
   * Delegates retrieval to the registry tool.
   * @param {string} name - Template name.
   * @returns {Object|null}
   */
  getTemplate(name) {
    return this.registry.getPattern(name);
  }

  /**
   * Merges multiple definitions/templates into a single output structure.
   *
   * @param {Array<Object|string>} definitions - Array of definitions or template names to merge.
   * @returns {Object} The consolidated ArtifactStructuralDefinition.
   */
  compose(definitions) {
    const finalDefinition = {};

    for (const item of definitions) {
      let definitionToMerge;
      
      if (typeof item === 'string') {
        definitionToMerge = this.getTemplate(item);
        if (!definitionToMerge) {
          throw new Error(`Template '${item}' not found during composition.`);
        }
      } else if (typeof item === 'object' && item !== null) {
        definitionToMerge = item;
      } else {
        continue; 
      }

      // Simple key-level merge (shallow merge strategy is central to this Composer's design)
      Object.assign(finalDefinition, definitionToMerge);
    }

    return finalDefinition;
  }
}

module.exports = ArtifactDefinitionComposer;