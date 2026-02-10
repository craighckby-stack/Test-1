/**
 * PolicyVerificationErrors.js
 * Sovereign AGI v94.1 Structured Error Definitions
 * Provides custom error classes for robust error handling and categorization 
 * within the Policy Formal Verification Unit.
 */

class PolicyVerificationError extends Error {
    public status: string;

    constructor(message: string, status: string = 'PVF_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        
        // Ensure robust stack trace capture across environments (Node/V8 vs standard JS)
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            // Fallback for non-V8 environments
            this.stack = (new Error(message)).stack;
        }
    }
}

class PolicyConfigError extends PolicyVerificationError {
    constructor(message: string = "Configuration required for verification failed to load or was invalid.") {
        super(message, 'CONFIG_LOAD_FAILURE');
    }
}

class PolicySchemaValidationError extends PolicyVerificationError {
    constructor(message: string = "Proposed policy update failed structural schema validation.") {
        super(message, 'SCHEMA_VIOLATION');
    }
}

class PolicyAxiomaticViolationError extends PolicyVerificationError {
    constructor(message: string = "Formal Verification Engine detected a violation of core policy axioms.") {
        super(message, 'FAILURE_AXIOMATIC');
    }
}

module.exports = {
    PolicyVerificationError,
    PolicyConfigError,
    PolicySchemaValidationError,
    PolicyAxiomaticViolationError
};