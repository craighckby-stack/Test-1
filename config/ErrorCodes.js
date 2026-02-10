/**
 * @fileoverview Centralized error code directory for the entire application.
 * This standardizes machine-readable error identifiers (codes) and associated defaults,
 * aiding integration with logging systems and API error mapping middleware.
 */

// NOTE: The former CodeRegistryLookupUtility logic has been extracted into the 
// 'RegistryLookupTool' plugin for use in complex, dynamic lookup scenarios.
// However, for this static configuration file, the lookup logic is implemented locally
// to ensure immediate availability and remove reliance on external kernel capabilities.

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
 * @param {string} key - The key from ERROR_CODES (e.g., 'AUDIT_GENERIC').
 * @returns {string}
 */
export function getStandardCode(key: string): string {
    // Cast key to the expected type for type safety when accessing the frozen object.
    const code = ERROR_CODES[key as keyof typeof ERROR_CODES];
    
    // Check if the value exists in the registry. (Object.freeze prevents prototype pollution checks.)
    if (code) {
        return code;
    }

    // Fallback to the mandatory default code.
    return ERROR_CODES.SYSTEM_UNKNOWN;
}