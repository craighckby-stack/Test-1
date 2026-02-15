import { ITelemetryService } from '../Plugins/Telemetry/ITelemetryService';

// Standard no-operation function to use as a fallback executor.
const NO_OP = () => {};

// Constants for GA configuration
const GA_DEFAULT_CATEGORY = 'App Interaction';
const GA_DEFAULT_DIMENSIONS = {};

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
     * @param {...any} args - Arguments to pass to the GA executor.
     */
    #executeGACommand(...args) {
        this.#gaExecutor(...args);
    }

    /**
     * Helper to resolve the global GA function reference.
     * @private
     * @returns {function} The window.ga function or a NO_OP function.
     */
    #resolveGAFunction() {
        return typeof window !== 'undefined' && typeof window.ga === 'function' 
            ? window.ga 
            : NO_OP;
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
            return;
        }

        if (!this.#trackingId) {
            throw new Error('[GAXTelemetryService Setup Error] A trackingId is required.');
        }

        // Resolve dependency once upon initialization
        this.#gaExecutor = this.#resolveGAFunction();

        if (this.#gaExecutor === NO_OP) {
            throw new Error('[GAXTelemetryService Error] Global GA function (window.ga) not found. Tracking commands will be ignored.');
        }

        // Initialize GA tracker
        this.#executeGACommand('create', this.#trackingId, 'auto');
    }

    /**
     * Tracks a page view event.
     * @param {string} path - The page path to track.
     * @param {Object} [properties={}] - Additional properties to set.
     */
    trackPageView(path, properties = {}) {
        if (!this.#isEnabled) return;

        this.#executeGACommand('set', { page: path, ...properties });
        this.#executeGACommand('send', 'pageview');
    }

    /**
     * Tracks a specific user action or custom event using GA's event model.
     * @param {string} eventName - The name of the event.
     * @param {Object} [properties={}] - Event properties including category, label, and value.
     */
    trackEvent(eventName, properties = {}) {
        if (!this.#isEnabled) return;

        const { category = GA_DEFAULT_CATEGORY, label, value, ...customDimensions } = properties;
        const action = eventName;
        const eventValue = value ? parseInt(value, 10) : 0;

        this.#executeGACommand('send', 'event', category, action, label, eventValue);

        // Set custom dimensions if provided
        Object.entries(customDimensions).forEach(([key, value]) => {
            this.#executeGACommand('set', `dimension${key}`, value);
        });
    }

    /**
     * Identifies the current user by setting the GA User ID.
     * @param {string} userId - The user identifier.
     * @param {Object} [traits={}] - User traits to set as custom dimensions.
     */
    identify(userId, traits = GA_DEFAULT_DIMENSIONS) {
        if (!this.#isEnabled) return;

        this.#executeGACommand('set', 'userId', userId);

        // Set custom dimensions from traits
        Object.entries(traits).forEach(([key, value]) => {
            this.#executeGACommand('set', `dimension${key}`, value);
        });
    }
}
