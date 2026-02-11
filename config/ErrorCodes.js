/**
 * @fileoverview Centralized error code directory for the entire application.
 * This standardizes machine-readable error identifiers (codes) and associated defaults,
 * aiding integration with logging systems and API error mapping middleware.
 */

// Internal, immutable definition of all error codes.
const _CODES_MAP = Object.freeze({
    // System / General
    SYSTEM_UNKNOWN: 'SYS_0000',

    // Auditor / Validation Failures (typically 400 series)
    AUDIT_GENERIC: 'AUDIT_4000',
    AUDIT_REQUIRED_FIELD: 'AUDIT_4001',
    AUDIT_CONSTRAINT_VIOLATION: 'AUDIT_4002',
    AUDIT_TYPE_MISMATCH: 'AUDIT_4003',

    // Authentication / Authorization Failures (401/403 series)
    AUTH_UNAUTHORIZED: 'AUTH_4010',
    AUTH_PERMISSION_DENIED: 'AUTH_4030',
    
    // Data / Resource Failures (404/500 series)
    RESOURCE_NOT_FOUND: 'DATA_4040',
    DATABASE_ERROR: 'DATA_5001'
});

/**
 * Private helper function to ensure safe lookup of an error code.
 * This function guarantees a fallback to SYSTEM_UNKNOWN if the key is invalid or undefined.
 * 
 * @param {string} key - The key from Codes (e.g., 'AUDIT_GENERIC').
 * @returns {string} The corresponding error code, or SYSTEM_UNKNOWN if not found.
 */
const _getValidatedCode = (key) => {
    return _CODES_MAP[key] || _CODES_MAP.SYSTEM_UNKNOWN;
};

/**
 * Standardized registry interface for accessing machine-readable error codes.
 * This unified interface provides safe lookup utilities and access to the immutable code enumeration.
 * @type {Readonly<{Codes: Readonly<Record<string, string>>, get: function(string): string}>}
 */
export const ErrorCodeRegistry = Object.freeze({
    /** The immutable map of all defined error codes. */
    Codes: _CODES_MAP,

    /**
     * Utility function to quickly access a standardized code.
     * @param {string} key - The key from Codes (e.g., 'AUDIT_GENERIC').
     * @returns {string}
     */
    get: _getValidatedCode
});