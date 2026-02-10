const ContentValidatorRegistry = require('./ContentValidatorRegistry');
// Conceptual dependency on the extracted utility for concurrency control
const { process: runInParallel } = require('@agi/TaskConcurrencyProcessor');

/**
 * ArtifactValidationService.js
 * Coordinates the execution of registered content validators against defined code artifacts or files.
 * This service decouples validation execution from validator registration, ensuring robust
 * and parallel quality assurance for the AGI kernel's large codebase operations.
 *
 * Improvement Note (Cycle 1): Extracted concurrency control logic into a dedicated TaskConcurrencyProcessor tool
 * (aliased as runInParallel) to simplify the validation orchestration pipeline and improve modularity.
 * Improvement Note (Cycle 2): Extracted result standardization into a dedicated private helper (`_standardizeResult`)
 * to clean up and DRY out the core validation logic (`_runSingleValidation`).
 */
class ArtifactValidationService {
    /**
     * @param {number} [concurrencyLimit=10] - The maximum number of validation tasks to run in parallel.
     */
    constructor(concurrencyLimit = 10) {
        // Uses the globally managed singleton registry instance
        this.registry = ContentValidatorRegistry;
        this.concurrencyLimit = Math.max(1, concurrencyLimit); // Ensure limit is at least 1
    }

    /**
     * Internal helper to standardize validation output structure.
     * @param {Object} params - Parameters including metadata and result state.
     * @returns {Object} The standardized validation result object.
     */
    _standardizeResult({
        id,
        validatorName,
        filePath,
        startTime,
        success,
        message,
        details = [],
        error = null,
        severity = 'ERROR'
    }) {
        return {
            id,
            validatorName,
            success,
            filePath,
            severity,
            details,
            message,
            // Ensure error is normalized (message string or null)
            error: error ? (error.stack || error.message || String(error)) : null,
            executionTimeMs: Date.now() - startTime
        };
    }

    /**
     * Internal helper to execute validation logic for a single artifact.
     * @param {Object} artifact - The artifact descriptor.
     * @param {number} index - Index in the original list.
     * @returns {Promise<Object>} The validation result.
     */
    async _runSingleValidation(artifact, index) {
        const startTime = Date.now();
        
        const { 
            id = `artifact-${index}`, 
            content, 
            validatorName, 
            config = {},
            filePath = 'unknown'
        } = artifact;

        // Base parameters used for all result standardization calls
        const baseParams = { id, validatorName, filePath, startTime };
        
        // --- Input and Metadata Checks ---

        if (!validatorName) {
             return this._standardizeResult({
                ...baseParams,
                success: false, 
                message: `Validation skipped: Artifact ${id} is missing 'validatorName'.`,
                severity: 'CRITICAL_INPUT'
            });
        }
        
        // Check for missing or null content before engaging validators
        if (content === undefined || content === null) {
             return this._standardizeResult({
                ...baseParams,
                success: false, 
                message: `Validation skipped: Artifact ${id} has undefined or null content.`,
                severity: 'CRITICAL_INPUT'
            });
        }

        const validator = this.registry.getValidator(validatorName);

        if (!validator) {
            return this._standardizeResult({
                ...baseParams,
                success: false,
                message: `Validation skipped: Validator '${validatorName}' not registered.`,
                severity: 'CRITICAL_SETUP'
            });
        }

        // --- Execution ---
        try {
            // The validator must return an object: 
            // { success: boolean, details: Array<Object>, error: Error | null, severity: string (optional) }
            const validationResult = await validator.validate(content, config);
            
            const details = validationResult.details || [];
            
            // Normalize severity: use validator's severity if provided, otherwise infer.
            const finalSeverity = validationResult.severity || (validationResult.success ? 'INFO' : 'ERROR');

            return this._standardizeResult({
                ...baseParams,
                success: !!validationResult.success,
                message: validationResult.message || (validationResult.success ? 'Validation successful.' : 'Validation failed.'),
                details: details,
                error: validationResult.error,
                severity: finalSeverity
            });

        } catch (error) {
            // Handle unexpected execution exceptions (e.g., code crash in self-generated validator)
            // CRITICAL_RUNTIME alerts the AGI kernel to an internal system stability issue.
            return this._standardizeResult({
                ...baseParams,
                success: false, 
                message: `Validation failed due to internal execution error in '${validatorName}'.`,
                error: error, 
                severity: 'CRITICAL_RUNTIME'
            });
        }
    }


    /**
     * Executes defined validation profiles against provided content/artifacts, respecting concurrency limits.
     * Delegates concurrency management to the TaskConcurrencyProcessor tool.
     * 
     * @param {Array<Object>} artifacts - List of artifact descriptors.
     * @returns {Promise<Array<Object>>} Validation results including execution metadata and details.
     */
    async validateArtifacts(artifacts) {
        if (!Array.isArray(artifacts)) {
            // Robust input validation
            throw new Error('ArtifactValidationService: Artifacts must be provided as an array.');
        }

        // Define the processing function, which maintains context via 'this'
        // This function matches the required signature (data_item, index) => Promise<result>
        const processorFn = (artifact, index) => this._runSingleValidation(artifact, index);

        // Utilize the extracted utility for controlled parallel execution
        return runInParallel(
            artifacts,
            processorFn,
            this.concurrencyLimit
        );
    }
}