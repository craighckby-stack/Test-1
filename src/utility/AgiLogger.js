/**
 * Sovereign AGI v95.0 - AgiLogger
 * Function: Standardized, structured logging utility for critical AGI operations.
 * Features: Contextual logging (module source), structured data payload support, and configurable levels.
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4
};

const MIN_LOG_LEVEL = LOG_LEVELS.INFO; // Default runtime level

class AgiLogger {
    /**
     * @param {string} sourceModule - The name of the module originating the log (e.g., 'SRM').
     */
    constructor(sourceModule) {
        this.source = sourceModule;
        this.timestamp = () => new Date().toISOString();
    }

    _emit(level, message, data = {}) {
        if (LOG_LEVELS[level] < MIN_LOG_LEVEL) {
            return;
        }

        const logEntry = {
            time: this.timestamp(),
            level: level,
            source: this.source,
            message: message,
            ...data
        };

        // In a production AGI system, this would push to a centralized log store (e.g., elastic/fluentd).
        // For simplicity, we serialize to the console.
        const output = `${logEntry.time} [${logEntry.level}] (${logEntry.source}): ${logEntry.message}`; 
        
        if (Object.keys(data).length > 0) {
            // Log structured data on a new line
            console.log(output, JSON.stringify(data));
        } else {
            console.log(output);
        }
    }

    debug(message, data) {
        this._emit('DEBUG', message, data);
    }

    info(message, data) {
        this._emit('INFO', message, data);
    }

    warn(message, data) {
        this._emit('WARN', message, data);
    }
    
    error(message, data) {
        this._emit('ERROR', message, data);
    }

    critical(message, data) {
        this._emit('CRITICAL', message, data);
    }
}

module.exports = AgiLogger;