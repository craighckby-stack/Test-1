/**
 * Custom error classes for the Governance subsystem.
 */

class GovernanceError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error raised when an action payload fails schema validation.
 */
class ActionValidationError extends GovernanceError {
    constructor(message, validationErrors = []) {
        super(message, { validationErrors });
        // Expose validation errors directly on the instance for easier programmatic handling
        this.validationErrors = validationErrors;
    }
}

/**
 * Error raised when the requested executor service cannot be found in the registry.
 */
class ExecutorNotFoundError extends GovernanceError {
    constructor(executorId, message) {
        const defaultMessage = `Requested executor service not found${executorId ? `: ${executorId}` : '.'}`;
        super(message || defaultMessage, { executorId });
        // Expose the missing ID directly
        this.executorId = executorId;
    }
}

module.exports = {
    GovernanceError,
    ActionValidationError,
    ExecutorNotFoundError
};