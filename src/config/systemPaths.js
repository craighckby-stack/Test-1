/**
 * Component ID: C-12
 * System Paths and Logging Configuration Utility.
 * Provides centralized, standardized access to filesystem paths for logs, caches, and core configuration.
 * This configuration relies on the Node.js 'path' module for environment-specific resolution.
 * @module systemPaths
 */

const path = require('path');

// Resolve ROOT_DIR relative to the location of this configuration file (two levels up from src/config)
const ROOT_DIR = path.resolve(__dirname, '..', '..');

/**
 * @typedef {object} AuditConfig
 * @property {string} FILE_NAME - The name of the audit log file.
 * @property {number} BATCH_SIZE - The number of records to batch before writing.
 * @property {number} FLUSH_INTERVAL_MS - Maximum time interval (ms) between flushes.
 */

/**
 * @typedef {object} SystemPathsConfig
 * @property {string} ROOT_DIR - The root directory of the application.
 * @property {string} LOG_DIR - Directory for storing all logs.
 * @property {string} CACHE_DIR - Directory for application caches.
 * @property {AuditConfig} AUDIT - Configuration for the Audit Logger (D-01).
 * @property {function(): string} getAuditPath - Function to get the full path to the audit log file.
 */

/** @type {SystemPathsConfig} */
const SystemPaths = {
    // Base directories
    ROOT_DIR,
    LOG_DIR: path.join(ROOT_DIR, 'logs'),
    CACHE_DIR: path.join(ROOT_DIR, 'cache'),
    
    // Audit Logger (D-01) specific configuration
    AUDIT: {
        FILE_NAME: 'ogt_decisions.jsonl',
        BATCH_SIZE: 50,
        FLUSH_INTERVAL_MS: 5000
    },

    /**
     * Retrieves the absolute path for the main audit log file.
     * @returns {string} The full audit log file path.
     */
    getAuditPath: function() {
        return path.join(SystemPaths.LOG_DIR, SystemPaths.AUDIT.FILE_NAME);
    }
};

module.exports = SystemPaths;