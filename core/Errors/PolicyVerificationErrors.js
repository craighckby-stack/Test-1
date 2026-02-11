const { RobustCustomError } = require('@core/errors/RobustCustomError');

/**
 * PolicyVerificationErrors.js
 * Sovereign AGI v94.1 Structured Error Definitions
 * Provides custom error classes for robust error handling and categorization 
 * within the Policy Formal Verification Unit.
 */

class PolicyVerificationError extends RobustCustomError {
    static STATUS_CODE = 'PVF_ERROR';

    constructor(message, status = PolicyVerificationError.STATUS_CODE) {
        super(message);
        // RobustCustomError handles stack trace capture and setting the name.
        this.status = status;
    }
}

class PolicyConfigError extends PolicyVerificationError {
    static STATUS_CODE = 'CONFIG_LOAD_FAILURE';

    constructor(message = "Configuration required for verification failed to load or was invalid.") {
        super(message, PolicyConfigError.STATUS_CODE);
    }
}

class PolicySchemaValidationError extends PolicyVerificationError {
    static STATUS_CODE = 'SCHEMA_VIOLATION';

    constructor(message = "Proposed policy update failed structural schema validation.") {
        super(message, PolicySchemaValidationError.STATUS_CODE);
    }
}

class PolicyAxiomaticViolationError extends PolicyVerificationError {
    static STATUS_CODE = 'FAILURE_AXIOMATIC';

    constructor(message = "Formal Verification Engine detected a violation of core policy axioms.") {
        super(message, PolicyAxiomaticViolationError.STATUS_CODE);
    }
}

module.exports = {
    PolicyVerificationError,
    PolicyConfigError,
    PolicySchemaValidationError,
    PolicyAxiomaticViolationError
};