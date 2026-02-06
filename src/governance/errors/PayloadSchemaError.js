/**
 * Custom error class for failures encountered during Mutation Payload Specification Engine validation.
 * Ensures that structural governance failures are auditable and catchable by designated upstream systems.
 */
class PayloadSchemaError extends Error {
    constructor(message, payload = {}, validationDetails = 'No details provided') {
        super(message);
        this.name = 'PayloadSchemaError';
        this.status = 400; 
        this.code = 'GOV_MPSE_BREACH';
        this.isOperational = true; // Indicates a predictable system failure based on input
        this.failedPayload = payload;
        this.validationDetails = validationDetails;
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PayloadSchemaError);
        }
    }
}

module.exports = { PayloadSchemaError };