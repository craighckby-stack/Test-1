// core/Telemetry/GAXTelemetryService.js
// Purpose: Centralized, structured logging and event emission for the GAX lifecycle, ensuring auditability.

const { TelemetryProvider } = require('./TelemetryProvider.js'); 
const { IdGenerator } = require('../Utils/IdGenerator.js'); 

/**
 * GAX Telemetry Service facilitates auditing and monitoring of Policy Evolution cycles.
 * It standardizes logging output structure across the Governance/Axiom components.
 */
class GAXTelemetryService {

    /**
     * Generates a robust, unique run ID prefixed for easy identification.
     * @param {string} prefix - The component prefix (e.g., 'PVF', 'GSEP-C').
     * @returns {string} The generated unique ID.
     */
    static generateRunId(prefix) {
        // IdGenerator is assumed to use high-integrity methods (e.g., UUIDs or similar transaction IDs)
        return IdGenerator.create(`${prefix}`); 
    }

    /**
     * Publishes a generic structured event to the underlying TelemetryProvider.
     * @param {string} eventName - Standardized event name (e.g., 'VERIFICATION_START').
     * @param {object} payload - Structured data associated with the event.
     * @param {string} level - Log level ('info', 'warn', 'error', 'debug', 'fatal').
     */
    static publish(eventName, payload = {}, level = 'info') {
        const standardPayload = {
            component: 'GAX_CORE',
            eventName: eventName,
            timestamp: Date.now(),
            ...payload
        };
        TelemetryProvider.log(level, `[GAX:${eventName}]`, standardPayload);
    }

    // --- Specialized High-Level Wrappers for common event types ---

    static debug(eventName, payload) {
        this.publish(eventName, payload, 'debug');
    }

    static warn(eventName, payload) {
        this.publish(eventName, payload, 'warn');
    }

    static error(eventName, payload) {
        this.publish(eventName, payload, 'error');
    }

    static fatal(eventName, payload) {
        this.publish(eventName, payload, 'fatal');
    }
    
    static success(eventName, payload) {
        this.publish(eventName, payload, 'info');
    }
    
    static failure(eventName, payload) {
        this.publish(eventName, payload, 'error');
    }
}

module.exports = GAXTelemetryService;