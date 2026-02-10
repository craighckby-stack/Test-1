/**
 * core/system/IsolatedFailureReporter.js
 * 
 * Handles safe, asynchronous reporting of system failures, ensuring that the
 * reporting mechanism itself cannot cause cascade failures or block the main thread.
 */
class IsolatedFailureReporter {
    /**
     * Initializes the reporter. Requires the ErrorSerializer dependency
     * (or equivalent class with a static safeSerialize method) and a transport function.
     * 
     * @param {function(Object): Promise<void>} transportFunction - Function responsible for sending the serialized data (e.g., an HTTP post).
     * @param {Class} ErrorSerializerClass - The dependency for serialization (expected to have a static safeSerialize method).
     */
    constructor(transportFunction, ErrorSerializerClass) {
        if (typeof transportFunction !== 'function') {
            throw new Error("IsolatedFailureReporter requires a valid transport function.");
        }
        if (!ErrorSerializerClass || typeof ErrorSerializerClass.safeSerialize !== 'function') {
            throw new Error("IsolatedFailureReporter requires a valid ErrorSerializer plugin dependency.");
        }
        
        this.transport = transportFunction;
        this.serializer = ErrorSerializerClass;
    }

    /**
     * Reports a failure. This operation is guaranteed to be isolated using a
     * microtask break (Promise.resolve()), ensuring it does not block the caller.
     * 
     * @param {Error|*} error - The error object or exception encountered.
     * @param {Object} [context={}] - Additional data relevant to the error location.
     */
    async report(error, context = {}) {
        // Use a microtask break to ensure the reporting mechanism is executed
        // asynchronously and doesn't block the caller, fulfilling the "Isolated" requirement.
        await Promise.resolve();

        try {
            // Utilize the abstracted serializer plugin for safe data packaging
            const failurePayload = this.serializer.safeSerialize(error, context);
            
            // Execute transport asynchronously
            await this.transport(failurePayload);

        } catch (transportError) {
            // CRITICAL: If the transport mechanism fails, we must catch and log internally.
            // We must not throw, as this would violate the isolation guarantee and potentially
            // cause a failure cascade where reporting itself becomes a source of errors.
            console.error(`[IsolatedFailureReporter] Transport failed during error reporting of ${error?.name || 'unknown error'}:`, transportError);
        }
    }
}