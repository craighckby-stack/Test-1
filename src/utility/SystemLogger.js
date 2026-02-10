/**
 * System Logger Utility (v94.1)
 * Provides structured, tiered logging (INFO, WARN, CRITICAL, DEBUG) 
 * for high-intelligence autonomous processes, replacing direct console calls.
 * This implementation delegates core logic (filtering, formatting, output) 
 * to the TieredSystemLoggerUtility plugin for robustness and configurability.
 */

// NOTE: TieredSystemLoggerUtility is assumed to be available via the AGI-KERNEL plugin infrastructure.
const TieredSystemLoggerUtility = require('../plugins/TieredSystemLoggerUtility'); // Placeholder path

class SystemLogger {
    /**
     * Creates a namespaced logger instance.
     * @param {string} component - The source component name (e.g., 'GovernanceValidator').
     */
    constructor(component) {
        this.component = component;
    }

    /**
     * Internal method to delegate logging execution to the utility plugin.
     * @param {string} level 
     * @param {string} message 
     * @param {object} [data={}] 
     */
    _log(level, message, data = {}) {
        TieredSystemLoggerUtility.execute({
            component: this.component,
            level: level,
            message: message,
            data: data
        });
    }

    /**
     * Set the global logging threshold for all SystemLogger instances via the utility plugin.
     * @param {string} level - E.g., 'INFO', 'DEBUG', 'CRITICAL'.
     */
    static setLevel(level) {
        if (TieredSystemLoggerUtility.setLevel) {
            TieredSystemLoggerUtility.setLevel(level);
        }
    }

    critical(message, data) { this._log('CRITICAL', message, data); }
    error(message, data) { this._log('ERROR', message, data); }
    warn(message, data) { this._log('WARN', message, data); }
    info(message, data) { this._log('INFO', message, data); }
    debug(message, data) { this._log('DEBUG', message, data); }
}

module.exports = SystemLogger;