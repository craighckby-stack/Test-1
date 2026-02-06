/**
 * ConsensusError
 * Specialized Error Class for the Sovereign AGI Consensus Stack.
 * 
 * Provides standardized, traceable, and categorizable error reporting.
 */

class ConsensusError extends Error {
    /**
     * @param {string} message - Human-readable description of the error.
     * @param {string} code - Machine-readable, unique error code (e.g., E_ATTESTATION_FAILED).
     * @param {object} [details={}] - Additional structured data for debugging.
     */
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'ConsensusError';
        this.code = code || 'E_UNKNOWN';
        this.details = details;
        
        // Capture stack trace in V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConsensusError);
        }
    }
    
    /**
     * Utility to create a structured error object for logs/API responses.
     */
    toJSON() {
        return {
            error: true,
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { ConsensusError };