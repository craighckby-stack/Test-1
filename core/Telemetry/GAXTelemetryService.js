import { ITelemetryService } from '../Plugins/Telemetry/ITelemetryService';

/**
 * Service implementation for Google Analytics (or equivalent GA-like backend).
 * Assumes the GA tracking script (analytics.js or gtag.js) is loaded globally.
 */
export class GAXTelemetryService implements ITelemetryService {
    private trackingId: string | null = null;
    private isEnabled: boolean = false;
    
    // Utility to ensure the GA function exists globally before calling
    private get ga(): (...args: any[]) => void {
        if (typeof window === 'undefined' || typeof (window as any).ga !== 'function') {
            if (this.isEnabled) {
                console.warn('Telemetry: GA function (window.ga) not found. Tracking commands ignored.');
            }
            return () => {}; // Return no-op function if not available
        }
        return (window as any).ga;
    }

    /**
     * Initializes the GA tracker.
     * @param config - Must include trackingId.
     */
    async init(config: { trackingId: string, enabled: boolean }): Promise<void> {
        this.trackingId = config.trackingId;
        this.isEnabled = config.enabled;

        if (!this.isEnabled) {
            console.log(`Telemetry Service (GAX) initialized but disabled.`);
            return;
        }
        
        if (!this.trackingId) {
            console.error('GAXTelemetryService requires a trackingId.');
            this.isEnabled = false;
            return;
        }

        // Initialize GA tracker
        this.ga('create', this.trackingId, 'auto');
        console.info(`Telemetry Service (GAX) initialized for ID: ${this.trackingId}`);
    }

    /**
     * Tracks a page view event.
     */
    trackPageView(path: string, properties?: Record<string, any>): void {
        if (!this.isEnabled) return;
        
        this.ga('set', { page: path, ...properties });
        this.ga('send', 'pageview');
    }

    /**
     * Tracks a specific user action or custom event using GA's event model.
     * Maps generic properties to GA's required (category, action, label, value).
     */
    trackEvent(eventName: string, properties: Record<string, any>): void {
        if (!this.isEnabled) return;
        
        const category = properties.category || 'App Interaction';
        const action = eventName;
        const label = properties.label || JSON.stringify(properties);
        // Value must be an integer in GA
        const value = properties.value ? parseInt(properties.value, 10) : 0;

        this.ga('send', 'event', category, action, label, value);
    }
    
    /**
     * Identifies the current user by setting the GA User ID.
     */
    identify(userId: string, traits?: Record<string, any>): void {
        if (!this.isEnabled) return;

        this.ga('set', 'userId', userId); 
        
        // In a complex implementation, traits would map to custom dimensions.
        if (traits) {
            // Example: this.ga('set', 'dimension1', traits.accountType);
        }
    }
}