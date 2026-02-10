const ContentValidatorRegistry = require('./ContentValidatorRegistry');

/**
 * ArtifactValidationService.js
 * Coordinates the execution of registered content validators against defined code artifacts or files.
 * This service decouples validation execution from validator registration, ensuring robust
 * and parallel quality assurance for the AGI kernel's large codebase operations.
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
     *   Example: [{ id: 'core-logic-1', content: '...', validatorName: 'jsLinter', config: {}, filePath: 'core/system.js' }]
     * @returns {Promise<Array<Object>>} Validation results including execution metadata and details.
     */
    async validateArtifacts(artifacts) {
        if (!Array.isArray(artifacts)) {
            // Robust input validation
            throw new Error('ArtifactValidationService: Artifacts must be provided as an array.');
        }

        const validationPromises = artifacts.map(async (artifact, index) => {
            const startTime = Date.now();
            
            const { 
                id = `artifact-${index}`, 
                content, 
                validatorName, 
                config = {},
                filePath = 'unknown' // Added context for AGI learning
            } = artifact;

            // Helper to standardize output structure
            const createResult = (success, message, details = [], error = null, severity = 'ERROR') => ({
                id,
                validatorName,
                success,
                filePath,
                severity,
                details,
                message,
                error,
                executionTimeMs: Date.now() - startTime
            });
            
            // --- Input and Metadata Checks ---

            if (!validatorName) {
                 return createResult(
                    false, 
                    `Validation skipped: Artifact ${id} is missing 'validatorName'.`,
                    [],
                    null,
                    'CRITICAL_INPUT'
                );
            }
            
            // Check for missing or null content before engaging validators
            if (content === undefined || content === null) {
                 return createResult(
                    false, 
                    `Validation skipped: Artifact ${id} has undefined or null content.`,
                    [],
                    null,
                    'CRITICAL_INPUT'
                );
            }

            const validator = this.registry.getValidator(validatorName);

            if (!validator) {
                return createResult(
                    false,
                    `Validation skipped: Validator '${validatorName}' not registered.`,
                    [],
                    null,
                    'CRITICAL_SETUP'
                );
            }

            // --- Execution ---
            try {
                // The validator must return an object: 
                // { success: boolean, details: Array<Object>, error: Error | null, severity: string (optional) }
                const validationResult = await validator.validate(content, config);
                
                const details = validationResult.details || [];
                
                // Normalize severity: use validator's severity if provided, otherwise infer.
                const finalSeverity = validationResult.severity || (validationResult.success ? 'INFO' : 'ERROR');

                return createResult(
                    !!validationResult.success,
                    validationResult.message || (validationResult.success ? 'Validation successful.' : 'Validation failed.'),
                    details,
                    validationResult.error ? validationResult.error.message : null,
                    finalSeverity
                );

            } catch (error) {
                // Handle unexpected execution exceptions (e.g., code crash in self-generated validator)
                // CRITICAL_RUNTIME alerts the AGI kernel to an internal system stability issue.
                return createResult(
                    false, 
                    `Validation failed due to internal execution error in '${validatorName}'.`,
                    [], 
                    error.stack || error.message, 
                    'CRITICAL_RUNTIME'
                );
            }
        });

        return Promise.all(validationPromises);
    }
}

module.exports = ArtifactValidationService;