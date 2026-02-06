/**
 * Custom error class for reporting configuration and environment variable failures.
 * Allows downstream systems to specifically catch and handle configuration issues
 * (e.g., halting startup gracefully or logging environment issues separately).
 */
export class ConfigurationError extends Error {
    constructor(message, context = {}) {
        // Prefix for clear identification
        const prefixedMessage = `SECURITY CONFIG ERROR: ${message}`;
        super(prefixedMessage);
        this.name = 'ConfigurationError';
        this.isOperational = true; // Indicates a known error type, not a bug
        this.context = context;
        
        // Maintain proper stack trace for where our error was generated (V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationError);
        }
    }
}