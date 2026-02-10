/**
 * core/config/CriticalPaths.js
 * 
 * Defines non-negotiable, mission-critical file system paths and endpoints 
 * required by isolated system components (like IsolatedFailureReporter) immediately 
 * upon boot, independent of the main configuration system.
 */

/**
 * Delegates to BootstrapConfigResolverUtility (conceptual plugin) to resolve 
 * configuration values, prioritizing environment variables.
 * @param envVar The environment variable key.
 * @param defaultValue The default value.
 * @returns The resolved value.
 */
function resolveCriticalPath(envVar: string, defaultValue: string | null): string | null {
    // Direct access required for early bootstrap phase, simulating call to BootstrapConfigResolverUtility
    if (typeof process !== 'undefined' && process.env && process.env[envVar]) {
        const value = process.env[envVar];
        // Ensure the environment variable is not just an empty string
        if (value !== null && value !== undefined && value.trim() !== '') {
            return value;
        }
    }
    return defaultValue;
}

export const CriticalPaths = {
    // Path used by IsolatedFailureReporter for synchronous, append-only security logging.
    ISOLATED_FAILURE_LOG: resolveCriticalPath(
        'AGI_ISOLATED_LOG_PATH',
        '/var/log/agi/isolated_failures.log'
    ),
    
    // Path for the secure, read-only recovery script repository.
    RECOVERY_SCRIPTS_ROOT: '/etc/agi/recovery_scripts/',

    // Optional: Low-level telemetry endpoint (if synchronous network I/O is possible).
    SECURE_TELEMETRY_ENDPOINT: null,
};

// --- Initialization ---
// This configuration must be loaded very early during the system bootstrap.
// The system startup should ensure these environment variables/paths are set and accessible.

if (CriticalPaths.ISOLATED_FAILURE_LOG) {
    // Using dynamic require due to early bootstrap context.
    const { IsolatedFailureReporter } = require('../system/IsolatedFailureReporter');
    // Asserting type since we checked for null above.
    IsolatedFailureReporter.setLogPath(CriticalPaths.ISOLATED_FAILURE_LOG as string);
}