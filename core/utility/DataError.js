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
        
        // Isolate external dependency interaction
        this.#delegateToErrorInitializer(code, isFatal);
    }

    /**
     * Dedicated private I/O proxy to delegate canonical property setting and stack capture to the utility.
     */
    #delegateToErrorInitializer(code: string, isFatal: boolean): void {
        ErrorInitializerUtility.initializeCanonicalError(this, code, isFatal, this.constructor);
    }
}

/**
 * Error specifically for issues related to handler configuration or instantiation.
 */
export class HandlerInstantiationError extends BaseError {
    
    /**
     * Synchronously prepares the canonical error metadata (code and fatal status).
     */
    #initializeDetails() {
        return {
            code: 'HANDLER_INSTANTIATION_FAILURE',
            isFatal: true // Fatal: Configuration is broken
        };
    }

    constructor(message: string) {
        const details = this.#initializeDetails();
        super(message, details.code, details.isFatal);
    }
}

/**
 * Error specifically for issues encountered during the retrieval attempt (I/O, network, strategy failures, or missing primitives).
 */
export class RetrievalError extends BaseError {

    /**
     * Synchronously prepares the canonical error metadata (code and fatal status).
     */
    #initializeDetails() {
        return {
            code: 'DATA_RETRIEVAL_FAILURE',
            isFatal: false
        };
    }

    constructor(message: string) {
        const details = this.#initializeDetails();
        super(message, details.code, details.isFatal);
    }
}