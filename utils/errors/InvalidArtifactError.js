/**
 * InvalidArtifactError
 * Custom error class specifically for failures during contract artifact validation.
 */
class InvalidArtifactError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'InvalidArtifactError';
        this.details = details; // Useful for passing fields or missing keys
        // Set prototype explicitly for correct `instanceof` usage
        Object.setPrototypeOf(this, InvalidArtifactError.prototype);
    }
}

module.exports = { InvalidArtifactError };
