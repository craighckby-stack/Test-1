import { ITelemetryService } from '../Plugins/Telemetry/ITelemetryService';

// Standard no-operation function to use as a fallback executor.
const NO_OP = () => {};

/**
 * Service implementation for Google Analytics (or equivalent GA-like backend).
 * Assumes the GA tracking script (analytics.js or gtag.js) is loaded globally.
 * @implements {ITelemetryService}
 */
export class GAXTelemetryService {
    #trackingId = null;
    #isEnabled = false;
    // Stores the resolved GA function (window.ga) or the NO_OP fallback.
    #gaExecutor = NO_OP;

    /**
     * Delegates the command arguments to the resolved GA executor function.
     * This acts as the I/O proxy for the external GA dependency (window.ga).
     * @private
     */
    #executeGACommand(...args) {
        this.#gaExecutor(...args);
    }

    /**
     * Helper to resolve the global GA function reference.
     * @returns {function} The window.ga function or a NO_OP function.
     */
    #resolveGAFunction() {
        if (typeof window !== 'undefined' && typeof window.ga === 'function') {
            return window.ga;
        }
        return NO_OP;
    }

    /**
     * Initializes the GA tracker.
     * @param {{ trackingId: string, enabled: boolean }} config - Configuration object.
     * @returns {Promise<void>}
     */
    async init(config) {
        this.#trackingId = config.trackingId;
        this.#isEnabled = config.enabled;

        if (!this.#isEnabled) {
            console.log(`[GAXTelemetryService] Initialized but disabled.`);
            return;
        }

        if (!this.#trackingId) {
            console.error('[GAXTelemetryService Setup Error] A trackingId is required.');
            this.#isEnabled = false;
            return;
        }

        // Resolve dependency once upon initialization
        this.#gaExecutor = this.#resolveGAFunction();

        if (this.#gaExecutor === NO_OP) {
            console.warn('[GAXTelemetryService Warning] Global GA function (window.ga) not found. Tracking commands will be ignored.');
        }

        // Initialize GA tracker
        this.#executeGACommand('create', this.#trackingId, 'auto');
        console.info(`[GAXTelemetryService] Initialized successfully for ID: ${this.#trackingId}.`);
    }

    /**
     * Tracks a page view event.
     */
    trackPageView(path, properties = {}) {
        if (!this.#isEnabled) return;

        this.#executeGACommand('set', { page: path, ...properties });
        this.#executeGACommand('send', 'pageview');
    }

    /**
     * Tracks a specific user action or custom event using GA's event model.
     */
    trackEvent(eventName, properties) {
        if (!this.#isEnabled) return;

        const category = properties.category || 'App Interaction';
        const action = eventName;
        const label = properties.label || JSON.stringify(properties);
        // Value must be an integer in GA
        const value = properties.value ? parseInt(properties.value, 10) : 0;

        this.#executeGACommand('send', 'event', category, action, label, value);
    }

    /**
     * Identifies the current user by setting the GA User ID.
     */
    identify(userId, traits) {
        if (!this.#isEnabled) return;

        this.#executeGACommand('set', 'userId', userId);

        // In a complex implementation, traits would map to custom dimensions.
        if (traits) {
            // Example: this.#executeGACommand('set', 'dimension1', traits.accountType);
        }
    }
}
