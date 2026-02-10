/**
 * @fileoverview Wrapper utility to format Errors into a consistent, safe, and consumable JSON structure
 * by delegating the task to the CanonicalErrorSerializer kernel plugin.
 */

// AGI-KERNEL: Utilizing CanonicalErrorSerializer for standardized error formatting.
// Assuming dependency injection or kernel context makes the plugin available.

const CanonicalErrorSerializer = require('@plugins/CanonicalErrorSerializer'); // Conceptual dependency resolution

class ErrorFormatter {
    /**
     * Converts an Error object into a serializable plain object using the kernel's canonical serializer.
     * @param {Error} err - The error object to format.
     * @param {boolean} [includeStack=false] - Whether to include the stack trace (default for logging, false for API response).
     * @returns {Object} Standardized error structure.
     */
    static format(err, includeStack = false) {
        if (CanonicalErrorSerializer && typeof CanonicalErrorSerializer.serialize === 'function') {
            return CanonicalErrorSerializer.serialize(err, includeStack);
        }
        
        // Fallback: If serialization service is unavailable, provide basic error formatting
        const status = err.status || 500;
        const code = err.code || 'SYS_INTERNAL_ERROR';
        
        // Mask sensitive internal messages for 5xx errors
        const message = status >= 500 && status < 600
            ? "An internal server error occurred."
            : err.message || "An unknown error occurred.";

        const genericFormat = {
            name: err.name || 'InternalError',
            code: code,
            status: status,
            message: message
        };

        if (includeStack) {
            genericFormat.stack = err.stack;
        }
        
        if (err.validationDetails) {
            genericFormat.validationDetails = err.validationDetails;
        }

        return genericFormat;
    }
}

module.exports = ErrorFormatter;