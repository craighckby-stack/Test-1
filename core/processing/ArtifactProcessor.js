const { 
  ResolutionError, 
  GenerationError, 
  ValidationError, 
  HookExecutionError,
  ArtifactBaseError 
} = require('./ArtifactError'); 
// NOTE: ContextualLogger dependency is assumed to be resolved (e.g., required from a utility path).

/**
 * ArtifactProcessor.js
 * Orchestrates the lifecycle of an ArtifactStructuralDefinition:
 * Dependency resolution, hook execution, generation, and structural validation.
 * 
 * Refactor V94.2: Abstracted internal logging into a dedicated ContextualLogger plugin 
 * for standardized output and cleaner component separation.
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
    const requiredServices = ['generator', 'validator'];
    const missing = requiredServices.filter(s => !services[s]);

    if (!definition) {
      throw new ArtifactBaseError("Processor initialization failed: Definition must be provided.");
    }
    if (missing.length > 0) {
      throw new ArtifactBaseError(`Processor initialization failed: Missing required services: ${missing.join(', ')}.`);
    }

    this.definition = definition;
    this.artifactId = definition.id || 'N/A';

    // Use the ContextualLogger plugin for standardized logging
    const BaseLogger = services.logger || console;
    // Assumes ContextualLogger is available in scope (e.g., via require or injection)
    this.logger = new ContextualLogger(`ArtifactProcessor:${this.artifactId}`, BaseLogger);
    
    this._validator = services.validator;
    // Standardize defaults to no-op methods returning expected structures
    this._resolver = services.resolver || { resolve: async () => ({ inputs: {} }) };
    this._hookExecutor = services.hookExecutor || { execute: async () => {} };
    this._generator = services.generator;
    
    // Removed: this._logger
  }

  /**
   * Executes a named pipeline hook defined in the artifact definition.
   */
  async _executeHooks(hookName, context) {
    const hookRef = this.definition.pipeline?.hooks?.[hookName];
    if (hookRef) {
      this.logger.info(`Executing hook: ${hookName}`);
      try {
        await this._hookExecutor.execute(hookRef, context);
      } catch (error) {
        this.logger.error(`Failed to execute hook ${hookName}.`, error);
        // Throw structured hook error, allowing strict management of pipeline flow.
        throw new HookExecutionError(`Hook ${hookName} failed`, hookName);
      }
    }
  }

  /**
   * Step 1: Fetches necessary dependencies required for generation.
   */
  async _stepResolveDependencies() {
    this.logger.info(`Resolving dependencies.`);
    const dependencyList = this.definition.dependencies || [];
    try {
        return await this._resolver.resolve(dependencyList);
    } catch (error) {
        this.logger.error(`Dependency resolution failed for artifact ${this.artifactId}.`, error);
        throw new ResolutionError(`Dependency resolution failed.`, dependencyList);
    }
  }

  /**
   * Step 3: Validates the structure of the generated artifact.
   */
  async _stepValidate(runtimeArtifact) {
    this.logger.info('Starting structural validation.');
    return this._validator.validate(this.definition.structure, runtimeArtifact);
  }


  /**
   * Main orchestration method to generate the artifact.
   * @returns {Promise<RuntimeArtifact>} The fully processed and validated artifact structure.
   */
  async generate() {
    this.logger.info(`Starting pipeline.`);

    // Centralized context for sharing state between steps and hooks
    const context = { 
        definition: this.definition, 
        inputs: null,
        generatedArtifact: null,
        validationResult: null
    };

    try {
        // 1. Resolve Dependencies
        context.inputs = await this._stepResolveDependencies();

        // 2. Pre-Generation Hook
        await this._executeHooks('preGen', context);

        // 3. Primary Generation Logic
        this.logger.info('Executing generation.');
        const generationPayload = {
            structure: this.definition.structure,
            inputs: context.inputs
        };

        context.generatedArtifact = await this._generator.run(
            this.definition.pipeline.generatorRef,
            generationPayload
        );
        
        // 4. Validation
        context.validationResult = await this._stepValidate(context.generatedArtifact);

        // 5. Post-Validation Hook 
        await this._executeHooks('postValidation', context);

        if (!context.validationResult.success) {
            const validationErrors = context.validationResult.errors || [];
            this.logger.warn(`Generation succeeded, but failed structural validation.`);
            
            // Structured Error Throw
            throw new ValidationError(`Structural validation failed`, validationErrors);
        }

        // 6. Post-Generation Success Hook
        await this._executeHooks('postGenSuccess', context.generatedArtifact);

        this.logger.info(`Pipeline completed successfully.`);
        return context.generatedArtifact;
        
    } catch (error) {
        // Propagate structured errors (ResolutionError, ValidationError, HookExecutionError)
        if (error instanceof ArtifactBaseError) {
             throw error; 
        } 
        
        // Catch unexpected infrastructure/generation failures and type them.
        this.logger.error(`Critical generation failure occurred.`, error);
        throw new GenerationError(`Unexpected failure during generation step.`, this.definition.pipeline?.generatorRef);
    }
  }
}

module.exports = ArtifactProcessor;