/**
 * Sovereign AGI v94.1 - Custom Error: Intent Validation Failure
 * Standardizes errors resulting from non-compliance with the M-01 Intent Schema.
 */
export class IntentValidationError extends Error {
    constructor(message, validationDetails = []) {
        // Prefix for quick identification in monitoring systems
        super(`[IntentValidation] ${message}`);
        this.name = 'IntentValidationError';
        this.details = validationDetails;
        this.timestamp = new Date().toISOString();
        // Standard HTTP status often associated with schema compliance failures
        this.httpStatus = 400; 
    }

    /**
     * Provides a clean serializable representation of the error.
     */
    toJson() {
        return {
            name: this.name,
            message: this.message,
            timestamp: this.timestamp,
            details: this.details,
            httpStatus: this.httpStatus
        };
    }
}