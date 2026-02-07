/**
 * AuditorError v2.0.0
 * Custom error class for signaling strict validation and constraint violations
 * encountered by security or integrity components (e.g., ParameterAuditor).
 * It now supports structured context (details) and standard serialization (toJSON).
 */
class AuditorError extends Error {
    /**
     * @param {string} message - A concise, descriptive error message.
     * @param {string} [code='AUDIT_GENERIC'] - A machine-readable error code.
     * @param {object} [details={}] - Structured context, e.g., { parameterName, failedValue, constraints }.
     */
    constructor(message, code = 'AUDIT_GENERIC', details = {}) {
        super(message);

        this.name = 'AuditorError';
        this.code = code;
        this.details = details;

        // Node.js/V8 specific optimization: captureStackTrace makes error instantiation cleaner in stack traces.
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, AuditorError);
        }
    }

    /**
     * Returns a JSON representation of the error, useful for logging and API transport.
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            stack: this.stack
        };
    }
}

export { AuditorError };
