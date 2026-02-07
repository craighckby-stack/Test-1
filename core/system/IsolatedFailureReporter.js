/**
 * core/system/IsolatedFailureReporter.js
 * 
 * Mechanism for reporting catastrophic failures using minimal, isolated dependencies
 * to ensure integrity even when the primary system environment is compromised.
 * Utilizes synchronous, low-level I/O paths (e.g., unbuffered file writes).
 *
 * NOTE: Assumes a Node.js environment for synchronous filesystem access (fs).
 */

// Default critical log path (should be overridden by CriticalPaths configuration)
let ISOLATED_LOG_PATH = '/var/log/agi/isolated_failures.log';

// Attempt to load synchronous file system handler once upon module initialization.
// This approach centralizes environment checking and optimizes subsequent report calls.
let fsSyncHandler = null;
try {
    // Check if we are in a Node-like environment before requiring 'fs'
    if (typeof require === 'function' && typeof process !== 'undefined' && process.versions && process.versions.node) {
        fsSyncHandler = require('fs');
    }
} catch (e) {
    // fsSyncHandler remains null if module loading fails or permissions are restricted.
}

export class IsolatedFailureReporter {

    /**
     * Set the target log path for isolated failure recording.
     * Must be called during system bootstrapping.
     * @param {string} path - The dedicated, highly secured log file path.
     */
    static setLogPath(path) {
        if (typeof path === 'string' && path.length > 0) {
            ISOLATED_LOG_PATH = path;
        }
    }

    /**
     * Reports a critical event through the isolated channel.
     * @param {object} failureData - Data describing the failure.
     */
    static report(failureData) {
        const timestamp = new Date().toISOString();
        const report = {
            time: timestamp,
            level: 'ISOLATED_CRITICAL',
            ...failureData
        };

        if (!fsSyncHandler) {
            // Fallback: If synchronous handler is unavailable (e.g., non-Node environment).
            console.error(`ISOLATED REPORTER WARNING: Synchronous I/O dependency (fs) is missing. Reporting to stderr.`);
            console.error(JSON.stringify(report, null, 2));
            return;
        }

        try {
            // 1. Log to the dedicated, unbuffered, append-only security log file.
            const logEntry = JSON.stringify(report) + '\n';
            
            // Use synchronous write to guarantee immediate disk persistence using append flag ('a')
            fsSyncHandler.writeFileSync(ISOLATED_LOG_PATH, logEntry, { flag: 'a' });

        } catch (e) {
            // If the isolated reporter fails itself (e.g., disk full, permission issue), 
            // log this failure via console/stderr as the ultimate, lowest-level fallback.
            console.error(`ISOLATED REPORTER FATAL FAIL (${e.message}): Cannot record catastrophic event to ${ISOLATED_LOG_PATH}`);
            console.error(report);
        }
    }
}