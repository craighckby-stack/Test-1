/**
 * @fileoverview Centralized error code directory for the entire application.
 * This standardizes machine-readable error identifiers (codes) and associated defaults,
 * aiding integration with logging systems and API error mapping middleware.
 */

export const ERROR_CODES = Object.freeze({
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
 * Utility function to quickly access a standardized code.
 * Provides safe lookup with a mandatory fallback to SYSTEM_UNKNOWN if the key is not found.
 * 
 * Performance Refactor: Using the logical OR operator for concise, safe fallback lookup,
 * relying on the fact that all codes are non-empty, truthy strings.
 * 
 * @param {string} key - The key from ERROR_CODES (e.g., 'AUDIT_GENERIC').
 * @returns {string}
 */
export function getStandardCode(key: string): string {
    // Use Record<string, string> for generic access to the frozen object.
    return (ERROR_CODES as Record<string, string>)[key] || ERROR_CODES.SYSTEM_UNKNOWN;
}