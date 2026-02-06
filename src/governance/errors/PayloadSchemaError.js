/**
 * @fileoverview Custom error class for failures encountered during Payload Specification Engine validation.
 * Represents a structured operational failure due to invalid input schema or governance rules violation.
 */

class PayloadSchemaError extends Error {
    /**
     * @param {string} message - A user-readable explanation of the error.
     * @param {Object} [payload={}] - The full or relevant part of the input payload that caused the failure.
     * @param {(Object|Array)} [validationDetails={}] - Structured data detailing specific validation failures (e.g., array of field errors).
     */
    constructor(message, payload = {}, validationDetails = {}) {
        // 1. Initialize Error infrastructure
        super(message);

        // 2. Standard Error properties
        this.name = 'PayloadSchemaError';
        
        // 3. Operational Metadata (For Auditing & API Response)
        this.status = 400; // HTTP Status: Bad Request / Client error
        this.code = 'GOV_MPSE_BREACH'; // Governance: Mutation Payload Specification Engine Breach
        this.isOperational = true; // Essential flag for operational error handling middleware

        // 4. Contextual Failure Data
        this.failedPayload = payload;
        // Switched default from string to object/array to enforce structured detail passing.
        this.validationDetails = validationDetails; 

        // 5. Stack Trace Management
        if (Error.captureStackTrace) {
            // Skips the constructor frame for a cleaner trace origin
            Error.captureStackTrace(this, PayloadSchemaError); 
        }
    }
}

module.exports = { PayloadSchemaError };