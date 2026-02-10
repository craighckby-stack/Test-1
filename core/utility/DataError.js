/**
 * @module DataError
 * @description Centralized custom error classes for data retrieval and handling operations.
 */

// Placeholder reference to the internal utility interface for initialization.
// In a real environment, this service would be injected or imported.
declare const ErrorInitializerUtility: {
    initializeCanonicalError(
        errorInstance: Error,
        code: string,
        isFatal: boolean,
        constructorRef: Function
    ): void;
};

/**
 * Base error class ensuring canonical structure (code, isFatal) and proper stack trace capture.
 */
class BaseError extends Error {
    public code: string;
    public isFatal: boolean;

    constructor(message: string, code: string, isFatal: boolean = false) {
        super(message);
        
        // Delegate canonical property setting and stack capture to the utility
        ErrorInitializerUtility.initializeCanonicalError(this, code, isFatal, this.constructor);
    }
}

/**
 * Error specifically for issues related to handler configuration or instantiation.
 */
export class HandlerInstantiationError extends BaseError {
    constructor(message: string, code: string = 'HANDLER_INSTANTIATION_FAILURE') {
        super(message, code, true); // Fatal: Configuration is broken
    }
}

/**
 * Error specifically for issues encountered during the retrieval attempt (I/O, network, strategy failures, or missing primitives).
 */
export class RetrievalError extends BaseError {
    constructor(message: string, code: string = 'DATA_RETRIEVAL_FAILURE') {
        super(message, code, false);
    }
}