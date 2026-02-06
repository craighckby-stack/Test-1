/**
 * InvalidArtifactError
 * Custom error class specifically for failures during contract artifact validation.
 * Used when required fields are missing, formats are incorrect, or definitions are corrupted.
 */
class InvalidArtifactError extends Error {
    /**
     * Standardized error code for programmatic identification.
     */
    static CODE = 'E_INVALID_ARTIFACT';

    /**
     * @param {string} message - Human-readable error message.
     * @param {object} [details={}] - Specific details about the validation failure (e.g., missing field names).
     */
    constructor(message, details = {}) {
        // Rely on modern Node/V8 environment where extending Error handles the prototype chain correctly.
        super(message);

        this.name = InvalidArtifactError.name;
        // Provide a standardized error code for easy programmatic identification upstream.
        this.code = InvalidArtifactError.CODE;
        this.details = details; 
    }
}

module.exports = { InvalidArtifactError };
