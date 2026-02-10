/**
 * @typedef {Object} AuditEvent
 * @property {string} entity - The system or component initiating the event (e.g., 'AGENT_CORE').
 * @property {string} action - The specific operation performed (e.g., 'REFRACTOR_START', 'DATA_ACCESS').
 * @property {number} timestamp - Unix timestamp of the event.
 * @property {string} level - Log level ('INFO', 'WARNING', 'CRITICAL').
 * @property {Object} details - Arbitrary structured payload.
 */

/**
 * AuditLogger_Service provides a centralized, decoupled mechanism
 * for logging immutable audit events across the AGI system.
 */
class AuditLogger_Service {
    /**
     * @type {Array<IAuditLogSink>}
     */
    sinks = [];

    /**
     * Initializes the Audit Logger Service.
     * Requires external log sink plugins (implementing IAuditLogSink).
     * @param {Array<IAuditLogSink>} sinks - An array of log sink plugins.
     */
    constructor(sinks = []) {
        if (!sinks || !Array.isArray(sinks)) {
            throw new Error("AuditLogger_Service requires an array of sinks.");
        }
        this.sinks = sinks;
        // Ensure all sinks implement the required methods
        this.sinks.forEach(sink => {
            if (typeof sink.log !== 'function') {
                throw new Error(`Sink ${sink.constructor.name} does not implement required 'log(event)' method.`);
            }
        });
    }

    /**
     * Standardizes an event payload into the official AuditEvent structure.
     *
     * @param {string} entity 
     * @param {string} action 
     * @param {string} level 
     * @param {Object} details 
     * @returns {AuditEvent}
     */
    _normalizeEvent(entity, action, level, details = {}) {
        return {
            entity: entity.toUpperCase(),
            action: action.toUpperCase(),
            timestamp: Date.now(),
            level: level.toUpperCase(),
            details: details,
        };
    }

    /**
     * Logs a general information audit event.
     * @param {string} entity 
     * @param {string} action 
     * @param {Object} [details={}] 
     */
    async info(entity, action, details = {}) {
        const event = this._normalizeEvent(entity, action, 'INFO', details);
        await this._dispatch(event);
    }

    /**
     * Logs a critical system warning or error event.
     * @param {string} entity 
     * @param {string} action 
     * @param {Object} [details={}] 
     */
    async critical(entity, action, details = {}) {
        const event = this._normalizeEvent(entity, action, 'CRITICAL', details);
        await this._dispatch(event);
    }

    /**
     * Dispatches the event to all registered sinks asynchronously.
     * Ensures dispatch failures in one sink do not prevent logging in others.
     * @param {AuditEvent} event 
     */
    async _dispatch(event) {
        if (this.sinks.length === 0) {
            // Fallback for systems running without configured persistence
            console.warn(`[AUDIT_FALLBACK] No sinks configured. Event: ${event.entity}/${event.action}`);
            return;
        }

        const dispatchPromises = this.sinks.map(sink => {
            // We wrap the async call in a Promise.resolve().catch() to ensure all promises in map settle
            return Promise.resolve(sink.log(event)).catch(error => {
                // This log handles errors specific to the sink's persistence logic
                console.error(`[AUDIT_ERROR] Failed dispatch to sink ${sink.constructor.name}:`, error);
            });
        });

        // Wait for all sinks to complete or fail gracefully
        await Promise.all(dispatchPromises);
    }
}

module.exports = { AuditLogger_Service };