/**
 * Manages dynamic velocity throttling and validates data against GVDM constraints.
 * Implements load-aware adaptive throttling based on real-time system metrics.
 */
import GVDM_CONFIG from '../config/GVDM.json';

// CRITICAL: We assume the AdaptiveThrottlePlugin is loaded by the Kernel.
// We expect to instantiate and initialize it if available.
let adaptiveThrottleTool: any;

class VelocityManager {
    private config: any;
    private vector_config: any;
    private monitor: any; // System load monitor

    constructor(system_monitor: any) {
        this.config = GVDM_CONFIG.velocity_control;
        this.vector_config = GVDM_CONFIG.vector_space;
        this.monitor = system_monitor; 
        
        // Initialize the abstracted tool to manage state and calculation logic
        if (typeof AdaptiveThrottlePlugin !== 'undefined') {
            // @ts-ignore: Assume AdaptiveThrottlePlugin is accessible globally and callable
            adaptiveThrottleTool = new AdaptiveThrottlePlugin();
            adaptiveThrottleTool.initialize(this.config);
        } else {
             // In a production environment, proper error handling or fallback injection would occur.
             console.warn("AdaptiveThrottlePlugin not loaded. Velocity management may be degraded.");
        }
    }

    static getDimension(): number {
        return GVDM_CONFIG.vector_space.embedding_dimension;
    }

    isHighVelocityEvent(data_change_percentage: number): boolean {
        if (data_change_percentage >= this.config.change_threshold_percent) {
            return true;
        }
        return false;
    }

    /**
     * Delegates the dynamic calculation of throttle delay to the AdaptiveThrottlePlugin.
     */
    getAdaptiveThrottleDelay(): number {
        if (adaptiveThrottleTool) {
            const load = this.monitor.getSystemLoadRatio(); // 0.0 to 1.0
            return adaptiveThrottleTool.calculateDelay(load);
        }
        
        // Fallback calculation if the tool is unavailable
        if (this.config.dynamic_throttle_enabled) {
            // Fixed rate calculation
            return 1000 / (this.config.max_velocity_events_per_s || 10);
        }
        return 0;
    }
}

export default VelocityManager;