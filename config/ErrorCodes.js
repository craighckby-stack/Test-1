/**
 * @fileoverview Centralized error code directory for the entire application.
 * This standardizes machine-readable error identifiers (codes) and associated defaults,
 * aiding integration with logging systems and API error mapping middleware.
 */

/**
 * Placeholder interface reference for the dynamically injected utility.
 * In a real execution environment, the CodeRegistryLookupUtility is available
 * for instantiation or injection.
 */
interface CodeRegistryLookupUtility {
    execute(args: { registry: Readonly<Record<string, string>>, key: string, defaultKey: string }): string;
}

// NOTE: Assuming CodeRegistryLookupUtility is available in the execution context.
// For demonstration, we simulate instantiation if needed, but in production, it should be injected.
declare const CodeRegistryLookupUtility: { new(): CodeRegistryLookupUtility };

const lookupUtility: CodeRegistryLookupUtility = new CodeRegistryLookupUtility();

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
 * Uses the CodeRegistryLookupUtility for safe, standardized lookup with fallback.
 * @param {string} key - The key from ERROR_CODES.
 * @returns {string}
 */
export function getStandardCode(key: string): string {
    return lookupUtility.execute({
        registry: ERROR_CODES,
        key: key,
        defaultKey: 'SYSTEM_UNKNOWN'
    });
}
