/**
 * TelemetryService (GAX v94.1)
 * Handles initialization, formatting, sampling, and decoupled asynchronous publishing 
 * of events to the central telemetry endpoint via a dedicated transport layer.
 */

const GAXEventRegistry = require('./GAXEventRegistry');
const TelemetryTransport = require('./TelemetryTransport'); 
const TelemetrySampler = require('./TelemetrySampler');   

// AGI-KERNEL PLUGIN INTEGRATION:
// EventPreflightValidator is used to enforce critical prerequisites (initialization, registration).
// Assuming EventPreflightValidator is injected/available via the runtime context.
const EventPreflightValidator = require('AGI-CORE/plugins/EventPreflightValidator');

class TelemetryService {
    constructor() {
        this.isInitialized = false;
        this.config = {};
        this.transport = null;
        this.sampler = null;
    }

    /**
     * Initializes the service with necessary configuration (e.g., endpoint, sampling rates).
     * @param {object} config - Telemetry configuration { endpoint, systemId, samplingRates, batchSize }
     */
    initialize(config) {
        if (this.isInitialized) {
            console.warn('TelemetryService already initialized.');
            return;
        }

        if (!config || !config.systemId || !config.endpoint) {
             throw new Error("Telemetry initialization failed: Must provide systemId and endpoint.");
        }

        this.config = config;
        
        // Initialize supporting components (dependency injection)
        this.transport = new TelemetryTransport(config);
        this.sampler = new TelemetrySampler(config.samplingRates || {});

        this.isInitialized = true;
        console.log(`TelemetryService initialized for system ${config.systemId}. Endpoint: ${config.endpoint}`);
    }

    /**
     * Handles internal faults occurring within the telemetry mechanism itself, 
     * preventing recursion and ensuring critical debugging info is logged locally.
     * Assumes GAXEventRegistry includes codes like DIAG_UNINITIALIZED, TEL_PUBLISH_FAILURE.
     * @param {string} faultName 
     * @param {object} details 
     */
    _handleInternalFault(faultName, details) {
        const fullDetails = { faultName, timestamp: Date.now(), details };
        // Use console.error for critical internal faults since the publish pipeline cannot be trusted.
        console.error(`[Telemetry Internal Fault: ${faultName}]`, fullDetails);
    }

    /**
     * Publishes a structured event to the telemetry pipeline.
     * @param {string} eventName - Must be a key from GAXEventRegistry values
     * @param {object} payload - Contextual data related to the event
     */
    async publish(eventName, payload = {}) {
        
        const fullyInitialized = this.isInitialized && !!this.transport && !!this.sampler;

        // 0. Precondition Check using the abstracted Validator
        const validationResult = EventPreflightValidator.execute({
            eventName: eventName,
            isInitialized: fullyInitialized,
            eventRegistry: GAXEventRegistry 
        });

        if (!validationResult.isValid) {
            this._handleInternalFault(
                validationResult.faultName, 
                validationResult.details || { attemptedEvent: eventName }
            );
            return;
        }

        // 2. Sampling Check
        if (!this.sampler.shouldSample(eventName)) {
            return; // Event dropped due to sampling policy
        }

        // 3. Packet Construction (using minimized keys for data efficiency)
        const telemetryPacket = {
            ts: Date.now(), 
            sid: this.config.systemId,
            e: eventName,
            d: payload 
        };
        
        // 4. Transport Delegation (Queueing/Batching)
        try {
            // The transport handles the actual asynchronous send/retry logic
            this.transport.queueEvent(telemetryPacket);
        } catch (error) {
            // Log transport failure internally, avoiding recursion
            this._handleInternalFault('TEL_PUBLISH_FAILURE', { event: eventName, transportError: error.message });
        }
    }
}

// Export a singleton instance, requiring explicit initialization via the initialize method
module.exports = new TelemetryService();