/**
 * @fileoverview AuditorError v2.1.1
 * Custom error class for signaling strict validation and constraint violations
 * encountered by security or integrity components (e.g., ParameterAuditor).
 * It provides structured context, standard serialization, and factory methods,
 * built on the reusable StructuredErrorBase.
 */

import { StructuredErrorBase } from './StructuredErrorBase';

class AuditorError extends StructuredErrorBase {
    /** The standard name for this error type. */
    name: 'AuditorError' = 'AuditorError';

    /** A version identifier for serialization tracking. */
    static VERSION = 'v2.1.1';

    /**
     * @param {string} message - A concise, descriptive error message.
     * @param {object} [options={}] - Configuration options for the error.
     * @param {string} [options.code='AUDIT_GENERIC'] - A machine-readable error code.
     * @param {object} [options.details={}] - Structured context.
     * @param {Error} [options.cause] - The underlying error.
     */
    constructor(message: string, options: { code?: string, details?: object, cause?: Error | any } = {}) {
        // Apply default code specific to AuditorError if not provided
        const effectiveOptions = {
            code: 'AUDIT_GENERIC',
            details: {},
            ...options
        };
        
        // All stack capturing, code/details assignment, and cause handling are done by StructuredErrorBase.
        super(message, effectiveOptions);
    }

    /**
     * Factory method for creating an AuditorError due to a required field being missing or empty.
     * @param {string} fieldName - The name of the missing field.
     * @param {object} [context={}] - Additional details.
     * @returns {AuditorError}
     */
    static requiredField(fieldName: string, context: object = {}): AuditorError {
        return new AuditorError(
            `Required field missing or invalid: ${fieldName}`,
            {
                code: 'AUDIT_REQUIRED_FIELD',
                details: { fieldName, ...context }
            }
        );
    }

    /**
     * Factory method for creating an AuditorError due to a value failing specific constraints.
     * @param {string} message - The failure description.
     * @param {object} constraints - The constraints that failed (e.g., { minLength: 5 }).
     * @returns {AuditorError}
     */
    static constraintViolation(message: string, constraints: object): AuditorError {
        return new AuditorError(message, {
            code: 'AUDIT_CONSTRAINT_VIOLATION',
            details: { constraints }
        });
    }

    // toJSON method is inherited from StructuredErrorBase
}

export { AuditorError };
