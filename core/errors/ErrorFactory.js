import { AuditorError } from '../errors/AuditorError.js';

// Access the AGI Kernel Tool for standardized error generation
declare const CanonicalErrorGenerator: {
    create(message: string, code?: string, context?: { cause?: Error | null, [key: string]: any }): Error;
};

/**
 * ErrorFactory v1.0.0
 * Standardized factory for creating consistent, structured application errors.
 */
class ErrorFactory {

    /**
     * Creates a new AuditorError instance for security or validation failures.
     * @param {string} message 
     * @param {object} [details={}] - Structured auditing context.
     * @returns {AuditorError}
     */
    static createAuditorError(message: string, details?: object): AuditorError {
        // This remains local as it depends on the imported domain-specific class AuditorError
        return new AuditorError(message, 'AUDIT_FAILURE', details);
    }

    /**
     * Creates a generic operational error (e.g., database timeout).
     * Now delegates structural creation to the CanonicalErrorGenerator tool.
     * @param {string} message 
     * @param {string} [code='OPERATIONAL_ERROR']
     * @param {Error | null} [cause=null]
     * @returns {Error}
     */
    static createOperationalError(message: string, code: string = 'OPERATIONAL_ERROR', cause: Error | null = null): Error {
        // Delegate the standardized structuring and creation to the reusable tool.
        return CanonicalErrorGenerator.create(message, code, { cause });
    }

    // ... other standardized error creation methods (e.g., createUnauthorizedError)
}

export default ErrorFactory;