// core/Telemetry/GAXTelemetryService.js
// Purpose: Centralized, structured logging and event emission for the GAX lifecycle, ensuring auditability and traceability.

const { TelemetryProvider } = require('./TelemetryProvider.js'); 
const { IdGenerator } = require('../Utils/IdGenerator.js'); 
// In a full implementation, require('./GAXEventRegistry.js') would be used here.

/**
 * @typedef {object} TelemetryContext
 * @property {string} component - The source component (e.g., 'CORE', 'PVF', 'GSEP').
 * @property {string} runId - The unique ID tracking the specific execution run (required for auditing cycles).
 * @property {string=} policyId - The ID of the policy being processed, if applicable.
 */

/**
 * GAX Telemetry Service facilitates auditing and monitoring of Policy Evolution cycles.
 * It standardizes logging output structure and acts as the official entry point for all GAX system events.
 */
class GAXTelemetryService {

    /**
     * Generates a robust, unique run ID prefixed for easy identification.
     * @param {string} prefix - The component prefix (e.g., 'PVF', 'GSEP-C').
     * @returns {string} The generated unique ID.
     */
    static createRunId(prefix) {
        // IdGenerator is assumed to use high-integrity methods (e.g., UUIDs or similar transaction IDs)
        return IdGenerator.create(`RUN_${prefix}`); 
    }

    /**
     * Publishes a generic structured event to the underlying TelemetryProvider.
     * Enforces structure using explicit context and data separation.
     * @param {string} eventName - Standardized event name (should be retrieved from GAXEventRegistry).
     * @param {TelemetryContext} context - Structured contextual metadata (component, runId).
     * @param {object} [data={}] - Detailed event payload data.
     * @param {string} [level='info'] - Log level ('info', 'warn', 'error', 'debug', 'fatal').
     */
    static publish(eventName, context, data = {}, level = 'info') {
        if (!context || !context.component || !context.runId) {
            // Self-logging error if crucial context is missing for traceability.
            TelemetryProvider.log('error', '[GAX:DIAG_CONTEXT_MISSING]', {
                eventName: eventName,
                requiredFields: ['component', 'runId'],
                receivedContext: context,
                timestamp: Date.now()
            });
            // Default context for compromised events
            context = { component: 'GAX_CORE', runId: 'N/A', ...context };
        }

        const standardPayload = {
            metadata: {
                timestamp: Date.now(),
                level: level,
                ...context
            },
            eventName: eventName,
            data: data
        };
        
        // Logging format includes Run ID for easier cross-component trace correlation.
        TelemetryProvider.log(level, `[GAX][${context.runId}] ${eventName}`, standardPayload);
    }

    // --- Specialized High-Level Wrappers (Simplified signatures, requiring explicit context) ---

    /** @param {string} eventName @param {TelemetryContext} context @param {object=} data */
    static debug(eventName, context, data) {
        this.publish(eventName, context, data, 'debug');
    }

    /** @param {string} eventName @param {TelemetryContext} context @param {object=} data */
    static info(eventName, context, data) {
        this.publish(eventName, context, data, 'info');
    }

    /** @param {string} eventName @param {TelemetryContext} context @param {object=} data */
    static warn(eventName, context, data) {
        this.publish(eventName, context, data, 'warn');
    }

    /** @param {string} eventName @param {TelemetryContext} context @param {object=} data */
    static error(eventName, context, data) {
        this.publish(eventName, context, data, 'error');
    }

    /** @param {string} eventName @param {TelemetryContext} context @param {object=} data */
    static fatal(eventName, context, data) {
        this.publish(eventName, context, data, 'fatal');
    }
    
    /** 
     * Logs successful operations. 
     * @param {string} eventName @param {TelemetryContext} context @param {object=} data 
     */
    static success(eventName, context, data) {
        this.publish(eventName, context, data, 'info');
    }
    
    /** 
     * Logs operational failures, classified as 'error' level. 
     * @param {string} eventName @param {TelemetryContext} context @param {object=} data 
     */
    static failure(eventName, context, data) {
        this.publish(eventName, context, data, 'error');
    }
}

module.exports = GAXTelemetryService;