/**
 * core/exceptions/ProtocolError.js
 * 
 * Custom error class for failures related to adherence to the Sovereign Manifest Protocol 
 * or core architectural contracts (e.g., required input compliance).
 */
class ProtocolError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'ProtocolError';
        this.statusCode = 500; // Internal Protocol Failure
        this.context = context;
        
        // Standard practice for V8/Node.js to fix stack trace origin
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ProtocolError);
        }
    }
}

module.exports = ProtocolError;
