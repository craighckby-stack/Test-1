// Define log levels and their weights (higher weight means higher priority/severity)
const LEVEL_WEIGHTS = Object.freeze({
    'debug': 10,
    'info': 20,
    'warn': 30,
    'error': 40,
    'critical': 50,
    'fatal': 60,
});
const DEFAULT_LEVEL = 'info';

// src/governance/TelemetryService.js
// Dedicated service for auditable governance logging and metrics tracking

class TelemetryService {
    /**
     * @param {object} config - Configuration object, e.g., { logLevel: 'info', source: 'AIA-CORE' }
     */
    constructor(config = {}) {
        this.source = config.source || 'AEOR';
        
        const requestedLevel = (config.logLevel || DEFAULT_LEVEL).toLowerCase();
        
        // Normalize logLevel: Ensure this.logLevel is always a recognized key. 
        const effectiveLevel = LEVEL_WEIGHTS[requestedLevel] ? requestedLevel : DEFAULT_LEVEL;
        
        this.logLevel = effectiveLevel;
        // Determine the minimum weight required for a message to be logged
        this.logLevelWeight = LEVEL_WEIGHTS[effectiveLevel];

        // Define a map for console sinks, adding robustness for environments lacking specific methods
        this.consoleSink = {
            fatal: console.error || console.log,
            critical: console.error || console.log,
            error: console.error || console.log,
            warn: console.warn || console.log,
            info: console.log,
            debug: console.log,
        };
    }

    _log(level, message, metadata = {}) {
        const levelWeight = LEVEL_WEIGHTS[level];

        // 1. Filtering: Suppress messages below the configured threshold
        if (!levelWeight || levelWeight < this.logLevelWeight) {
            return;
        }

        // 2. Formatting
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            source: this.source,
            message,
            ...metadata
        };
        
        // NOTE: In a production AIA system, this output would be asynchronously
        // piped to a durable, cryptographically verifiable audit log (D-01 requirement).
        
        // Simplified console logging for demonstration:
        const output = JSON.stringify(logEntry, null, 2);

        // 3. Output via mapped console sink
        const sink = this.consoleSink[level] || console.log;
        sink(output);
    }

    fatal(message, metadata) {
        this._log('fatal', message, metadata);
    }
    critical(message, metadata) {
        this._log('critical', message, metadata);
    }
    error(message, metadata) {
        this._log('error', message, metadata);
    }
    warn(message, metadata) {
        this._log('warn', message, metadata);
    }
    info(message, metadata) {
        this._log('info', message, metadata);
    }
    debug(message, metadata) {
        this._log('debug', message, metadata);
    }
}

module.exports = TelemetryService;