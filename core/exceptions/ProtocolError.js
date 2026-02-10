/**
 * core/exceptions/ProtocolError.js
 * 
 * Custom error class for failures related to adherence to the Sovereign Manifest Protocol 
 * or core architectural contracts.
 * Inherits standardized error handling from BaseApplicationError.
 */
const BaseApplicationError = require('./BaseApplicationError');

class ProtocolError extends BaseApplicationError {
    /**
     * @param {string} message - Human-readable error message.
     * @param {object} [context={}] - Optional metadata relevant to the error occurrence.
     */
    constructor(message, context = {}) {
        // Protocol failures are typically Internal Server Errors (500).
        // The status code and stack trace setup are handled by BaseApplicationError.
        super(message, 500, context);
    }
}

module.exports = ProtocolError;