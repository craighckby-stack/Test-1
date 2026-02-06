/**
 * ArtifactProcessor.js
 * Orchestrates the lifecycle of an ArtifactStructuralDefinition:
 * Dependency resolution, hook execution, generation, and structural validation.
 */
class ArtifactProcessor {
  /**
   * @param {ArtifactStructuralDefinition} definition The artifact definition structure.
   * @param {Object} services
   * @param {ArtifactValidator} services.validator
   * @param {DependencyResolver} services.resolver
   * @param {HookExecutor} services.hookExecutor
   * @param {CodeGenerator} services.generator
   * @param {Logger} services.logger
   */
  constructor(definition, services = {}) {
    if (!definition || !services.generator || !services.validator) {
      throw new Error("ArtifactProcessor requires definition, generator, and validator services.");
    }
    this.definition = definition;
    this.validator = services.validator;
    this.resolver = services.resolver || { resolve: async () => ({ inputs: {} }) }; // Default no-op resolver
    this.hookExecutor = services.hookExecutor || { execute: async () => {} }; // Default no-op executor
    this.generator = services.generator;
    this.logger = services.logger || console; // Fallback to console
  }

  /**
   * Executes a named pipeline hook defined in the artifact definition.
   * @param {string} hookName - e.g., 'preGen', 'postValidation'
   * @param {any} context - Context passed to the hook executor.
   */
  async executeHooks(hookName, context) {
    const hookRef = this.definition.pipeline?.hooks?.[hookName];
    if (hookRef) {
      this.logger.info(`[ArtifactProcessor] Executing hook: ${hookName}`);
      try {
        // Delegate execution to the specialized HookExecutor service
        await this.hookExecutor.execute(hookRef, context);
      } catch (error) {
        this.logger.error(`Failed to execute hook ${hookName}:`, error);
        // Depending on system requirements, might rethrow here.
      }
    }
  }

  /**
   * Validates the structure of the generated artifact against the definition schema.
   * @param {RuntimeArtifact} runtimeArtifact - The artifact generated output.
   * @returns {Promise<{success: boolean, errors: string[]}>}
   */
  async validate(runtimeArtifact) {
    // Delegate complex structural validation to the ArtifactValidator service
    return this.validator.validate(this.definition.structure, runtimeArtifact);
  }

  /**
   * Fetches necessary dependencies required for generation.
   * @returns {Promise<Object>} Required inputs/dependencies.
   */
  async resolveInputs() {
    this.logger.info(`[ArtifactProcessor] Resolving dependencies.`);
    try {
        const requiredInputs = await this.resolver.resolve(this.definition.dependencies || []);
        return requiredInputs;
    } catch (error) {
        this.logger.error("Dependency resolution failed:", error);
        throw new Error("Dependency Resolution Failure");
    }
  }

  /**
   * Main orchestration method to generate the artifact.
   * @returns {Promise<RuntimeArtifact>} The fully processed and validated artifact structure.
   */
  async generate() {
    this.logger.info(`[ArtifactProcessor] Starting generation for definition: ${this.definition.id || 'N/A'}`);

    const resolvedInputs = await this.resolveInputs();

    // 1. Pre-Generation Hook
    await this.executeHooks('preGen', { definition: this.definition, inputs: resolvedInputs });

    // 2. Primary Generation Logic
    const generationPayload = {
        structure: this.definition.structure,
        inputs: resolvedInputs
    };

    let generatedArtifact;
    try {
        generatedArtifact = await this.generator.run(
            this.definition.pipeline.generatorRef,
            generationPayload
        );
    } catch (error) {
        this.logger.error("Artifact generation failed unexpectedly.", error);
        throw new Error("Generation Execution Failure");
    }

    // 3. Validation
    const validationResult = await this.validate(generatedArtifact);

    // 4. Post-Validation Hook
    await this.executeHooks('postValidation', { artifact: generatedArtifact, validation: validationResult });

    if (!validationResult.success) {
      this.logger.warn(`Artifact generation successful but failed structural validation. Errors: ${validationResult.errors.length}`);
      throw new Error(`Structural Validation Failed: ${validationResult.errors.join('; ')}`);
    }

    // 5. Post-Generation Success Hook (For completed artifacts)
    await this.executeHooks('postGenSuccess', generatedArtifact);

    this.logger.info(`[ArtifactProcessor] Generation completed successfully.`);
    return generatedArtifact;
  }
}

module.exports = ArtifactProcessor;