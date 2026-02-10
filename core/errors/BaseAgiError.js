import { CanonicalPayloadSerializer } from './utils/CanonicalPayloadSerializer';

/**
 * Sovereign AGI v94.1 - Core Utility: Base Error Class
 * Provides a foundational structure for all custom application errors in the AGI system,
 * ensuring consistency in logging, monitoring, and serialization by leveraging canonical utilities.
 */

// NOTE: The dependency on AgiKernelTools is now encapsulated within CanonicalPayloadSerializer.

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
        
        /** @type {number} */
        this.httpStatus = httpStatus;

        // V8 optimization for cleaner stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Provides a clean serializable representation of the error, utilizing the abstracted
     * canonical payload serialization utility.
     * @returns {Object} Serialized error object.
     */
    toJson(): Object {
        return CanonicalPayloadSerializer.serializeErrorPayload({
            name: this.name,
            message: this.message,
            httpStatus: this.httpStatus
        });
    }
}