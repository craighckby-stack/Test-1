const ContentValidatorRegistry = require('./ContentValidatorRegistry');

/**
 * ArtifactValidationService.js
 * Coordinates the execution of registered content validators against defined code artifacts or files.
 * This service decouples validation execution from validator registration.
 * Crucial for the AGI kernel's self-assessment and code quality assurance.
 */
class ArtifactValidationService {
    constructor() {
        // Uses the globally managed singleton registry instance
        this.registry = ContentValidatorRegistry;
    }

    /**
     * Executes defined validation profiles against provided content/artifacts.
     * Artifacts must specify the required validator name.
     * 
     * @param {Array<Object>} artifacts - List of artifact descriptors.
     *   Example: [{ id: 'core-logic-1', content: '...', validatorName: 'jsLinter', config: {} }]
     * @returns {Promise<Array<Object>>} Validation results including execution metadata.
     */
    async validateArtifacts(artifacts) {
        if (!Array.isArray(artifacts)) {
            // Robust input validation
            throw new Error('ArtifactValidationService: Artifacts must be provided as an array.');
        }

        const validationPromises = artifacts.map(async (artifact, index) => {
            const startTime = Date.now();
            
            // Ensure artifact has necessary identifying properties for robust error reporting
            const { id = `artifact-${index}`, content, validatorName, config = {} } = artifact;

            if (!validatorName) {
                 return {
                    id,
                    validatorName: 'MISSING',
                    success: false,
                    executionTimeMs: Date.now() - startTime,
                    message: `Validation skipped: Artifact ${id} is missing 'validatorName'.`
                };
            }
            
            const validator = this.registry.getValidator(validatorName);

            if (!validator) {
                return {
                    id,
                    validatorName,
                    success: false,
                    executionTimeMs: Date.now() - startTime,
                    message: `Validation skipped: Validator '${validatorName}' not registered.`
                };
            }

            try {
                // The validator must return an object: { success: boolean, details: Array<Object>, error: Error | null }
                const validationResult = await validator.validate(content, config);
                
                return {
                    id,
                    validatorName,
                    success: validationResult.success,
                    details: validationResult.details || [],
                    error: validationResult.error ? validationResult.error.message : null, // Extract message for JSON serialization
                    executionTimeMs: Date.now() - startTime
                };
            } catch (error) {
                // Handle unexpected execution exceptions (e.g., code crash in self-generated validator)
                return {
                    id,
                    validatorName,
                    success: false,
                    message: `Validation failed due to internal execution error in '${validatorName}'.`,
                    error: error.message, 
                    executionTimeMs: Date.now() - startTime
                };
            }
        });

        return Promise.all(validationPromises);
    }
}

module.exports = ArtifactValidationService;
