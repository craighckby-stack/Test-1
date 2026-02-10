/**
 * Sovereign AGI v94.1 - Core Utility: Base Error Class
 * Provides a foundational structure for all custom application errors in the AGI system,
 * ensuring consistency in logging, monitoring, and serialization by leveraging canonical utilities.
 */

// NOTE: AgiKernelTools is an abstract representation of the runtime tool access mechanism
// available to core kernel modules.
declare const AgiKernelTools: {
    CanonicalErrorPayloadGenerator: {
        generate: (data: { message: string, name: string, httpStatus: number }) => any;
    }
};

export class BaseAgiError extends Error {
    
    /** @type {number} */
    public httpStatus: number;

    /**
     * @param {string} message - The core human-readable error description.
     * @param {string} [name='AgiError'] - The specific error name.
     * @param {number} [httpStatus=500] - The appropriate HTTP status code for this error type.
     */
    constructor(message: string, name: string = 'AgiError', httpStatus: number = 500) {
        super(message);
        this.name = name;
        
        // Removed instance timestamp generation; serialization utility handles canonical timing.
        
        /** @type {number} */
        this.httpStatus = httpStatus;

        // V8 optimization for cleaner stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Provides a clean serializable representation of the error, leveraging the canonical payload generator.
     * The timestamp is generated during serialization by the utility to ensure it reflects the time of output.
     * @returns {Object} Serialized error object.
     */
    toJson(): Object {
        // Use the CanonicalErrorPayloadGenerator tool to enforce standardized structure and timestamp generation.
        if (typeof AgiKernelTools !== 'undefined' && AgiKernelTools.CanonicalErrorPayloadGenerator) {
             return AgiKernelTools.CanonicalErrorPayloadGenerator.generate({
                name: this.name,
                message: this.message,
                httpStatus: this.httpStatus
            });
        }

        // Fallback implementation for environments lacking the kernel tool utility.
        return {
            name: this.name,
            message: this.message,
            timestamp: new Date().toISOString(),
            httpStatus: this.httpStatus
        };
    }
}