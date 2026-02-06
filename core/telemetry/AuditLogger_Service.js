/**
 * Sovereign AGI v94.1 Audit Logger Service
 * Handles standardized, structured, and centralized operational logging (telemetry).
 * Designed for non-blocking internal audit trails and error reporting.
 */
class AuditLogger_Service {
    /**
     * @param {Object} dependencies
     * @param {Object} dependencies.config - Telemetry configuration settings.
     * @param {Object} [dependencies.queueService] - Optional Queueing service for asynchronous log dispatch.
     */
    constructor({ config, queueService }) {
        this.config = config.telemetry_config || {};
        this.queueService = queueService;
        if (!this.queueService) {
             // In v94.1, reliance on an external Queue for high throughput is expected.
             console.warn("AuditLogger initialized without QueueService. Logging will be synchronous and potentially blocking.");
        }
    }

    /**
     * Standardizes the log payload structure.
     * @param {Object} data - Log details.
     * @param {string} type - 'AUDIT', 'ERROR', or 'DEBUG'.
     * @returns {Object} Structured log entry.
     */
    _structureLog(data, type) {
        return {
            timestamp: new Date().toISOString(),
            type: type.toUpperCase(),
            level: data.level || (type === 'ERROR' ? 'CRITICAL' : 'INFO'),
            source: data.service || 'UNKNOWN',
            ...data
        };
    }

    /**
     * Logs general operational events for auditing.
     * @param {Object} data - Audit details (e.g., operation, resource_id).
     */
    logAudit(data) {
        const entry = this._structureLog(data, 'AUDIT');
        this._writeLog(entry);
    }

    /**
     * Logs errors or critical exceptions encountered by services.
     * @param {Object} data - Error details (e.g., error_type, details, stack_trace).
     */
    logError(data) {
        const entry = this._structureLog(data, 'ERROR');
        this._writeLog(entry);
    }

    /**
     * Internal method to dispatch the log entry, utilizing the QueueService if available.
     * @param {Object} entry - The structured log entry.
     */
    _writeLog(entry) {
        const logLine = JSON.stringify(entry);
        
        if (this.queueService) {
            // Non-blocking dispatch to external logging sink/stream
            // Assumes queueService has an optimized non-awaiting enqueue method.
            this.queueService.enqueue('telemetry_stream', logLine);
        } else {
            // Fallback synchronous logging (e.g., development environment, high-severity alerts)
            console.error(logLine);
        }
    }
}

module.exports = AuditLogger_Service;