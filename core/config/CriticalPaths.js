import { EnvVarResolver } from "#plugins/EnvVarResolver";

/**
 * core/config/CriticalPaths.js
 *
 * Defines non-negotiable, mission-critical file system paths and endpoints 
 * required by isolated system components (like IsolatedFailureReporter) immediately 
 * upon boot, independent of the main configuration system.
 */

/**
 * Uses the abstracted EnvVarResolver utility to resolve configuration values,
 * prioritizing environment variables.
 */
const resolveCriticalPath = EnvVarResolver.resolve;

export const CriticalPaths = Object.freeze({
    // Path used by IsolatedFailureReporter for synchronous, append-only security logging.
    ISOLATED_FAILURE_LOG: resolveCriticalPath(
        'AGI_ISOLATED_LOG_PATH',
        '/var/log/agi/isolated_failures.log'
    ),
    
    // Path for the secure, read-only recovery script repository.
    RECOVERY_SCRIPTS_ROOT: '/etc/agi/recovery_scripts/',

    // Optional: Low-level telemetry endpoint (if synchronous network I/O is possible).
    SECURE_TELEMETRY_ENDPOINT: null,
});

// --- Initialization ---
// This configuration must be loaded very early during the system bootstrap.

if (CriticalPaths.ISOLATED_FAILURE_LOG) {
    // WARNING: Using dynamic require due to early bootstrap context necessity.
    // This initialization step must occur before the main module system is fully ready.
    try {
        const { IsolatedFailureReporter } = require('../system/IsolatedFailureReporter');
        // Asserting type since we checked for null above.
        IsolatedFailureReporter.setLogPath(CriticalPaths.ISOLATED_FAILURE_LOG as string);
    } catch (e) {
        // Failure to load the reporter here is non-critical if handled by subsequent boot stages.
    }
}