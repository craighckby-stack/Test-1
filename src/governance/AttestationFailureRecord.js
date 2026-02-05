/**
 * ATTENTION FAILURE RECORD (AFR)
 * ID: AFR-E01
 * GSEP Role: Standardized error structure for pre-execution integrity checks.
 *
 * This record ensures that governance failures are reported consistently, including
 * necessary metadata for telemetry and auditing (e.g., error codes, full reports).
 */

class AttestationFailureRecord extends Error {
    /**
     * @param {string} code - Standardized error code (e.g., RAM_CHECK_FAIL).
     * @param {string} message - Human-readable explanation of the error.
     * @param {object} [details={}] - Optional data payload, often containing the full AttestationReport.
     */
    constructor(code, message, details = {}) {
        // Ensure the message starts with the code for quick log identification
        super(`[${code}]: ${message}`);
        this.code = code;
        this.details = details;
        this.name = 'AttestationFailureRecord';
        
        // Capture the stack trace unless already handled by Error constructor
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AttestationFailureRecord);
        }
    }

    /**
     * Returns the failure record data as a serializable object for telemetry.
     */
    toTelemetryObject() {
        return {
            error_name: this.name,
            error_code: this.code,
            message: this.message,
            timestamp: new Date().toISOString(),
            details: this.details
        };
    }
}

module.exports = AttestationFailureRecord;