/**
 * @fileoverview AuditorError v2.1.0
 * Custom error class for signaling strict validation and constraint violations
 * encountered by security or integrity components (e.g., ParameterAuditor).
 * It provides structured context, standard serialization, and factory methods.
 */

// AGI-KERNEL Integration: Declare the specialized serialization utility for standardized error formatting.
declare const StructuredErrorSerializerTool: {
    execute(error: any): { 
        name: string; 
        code: string; 
        message: string; 
        details: any; 
        stack?: string; 
        cause?: any 
    };
};

class AuditorError extends Error {
    /** The standard name for this error type. */
    name: 'AuditorError' = 'AuditorError';

    /** Machine-readable error code. */
    code: string;

    /** Structured context details. */
    details: object;

    /** A version identifier for serialization tracking. */
    static VERSION = 'v2.1.0';

    /**
     * @param {string} message - A concise, descriptive error message.
     * @param {object} [options={}] - Configuration options for the error.
     * @param {string} [options.code='AUDIT_GENERIC'] - A machine-readable error code (e.g., 'AUDIT_REQUIRED_FIELD').
     * @param {object} [options.details={}] - Structured context, e.g., { parameterName, failedValue, constraints }.
     * @param {Error} [options.cause] - The underlying error that caused this AuditorError (for error wrapping).
     */
    constructor(message: string, options: { code?: string, details?: object, cause?: Error | any } = {}) {
        // Error cause handling is standard practice in modern JS/TS error systems
        super(message, { cause: options.cause });

        const { code = 'AUDIT_GENERIC', details = {} } = options;

        this.code = code;
        this.details = details;

        // Node.js/V8 specific optimization: captureStackTrace makes error instantiation cleaner in stack traces.
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, AuditorError);
        }
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

    /**
     * Returns a structured representation of the error, useful for standardized logging and API responses.
     * This uses the AGI-KERNEL serialization utility for standardized output format and handling of nested causes.
     */
    toJSON(): object {
        if (typeof StructuredErrorSerializerTool?.execute === 'function') {
            // Use the kernel utility for robust and standardized serialization
            return StructuredErrorSerializerTool.execute(this);
        }

        // Fallback implementation if the serialization tool is not available
        const output: Record<string, any> = {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            stack: this.stack
        };
        
        // Fallback cause serialization
        if (this.cause) {
            output.cause = this.cause instanceof Error && typeof (this.cause as any).toJSON === 'function'
                ? (this.cause as any).toJSON()
                : String(this.cause);
        }

        return output;
    }
}

export { AuditorError };