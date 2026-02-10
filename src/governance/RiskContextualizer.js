/**
 * RiskContextualizer.js
 * 
 * Utility responsible for monitoring mission context, environment variables, 
 * and external threat signals to dynamically adjust RCDM parameters 
 * (specifically 'risk_matrix.weighted_factors' and 'risk_tiers.thresholds') 
 * at runtime.
 */

// Configuration data moved outside the class and into a constant/external source
const CONTEXT_MAP_DATA = {
    'HIGH_SECURITY_MISSION': {
        'risk_matrix.weighted_factors': [
            { 'metric_id': 'A_ANOMALY', 'weight': 0.60 },
            { 'metric_id': 'V_COMPLIANCE', 'weight': 0.25 },
            { 'metric_id': 'R_STARVATION', 'weight': 0.15 }
        ],
        'risk_tiers.HIGH.threshold': 0.60
    },
    'BASELINE': {} // Explicit baseline context
    // ... other contexts 
};

/**
 * Placeholder interface for the RCDM Manager (external interface to apply config)
 */
interface RCDMManager {
    applyConfigOverlay(overlay: any): void;
}

/**
 * Interface definition for the extracted plugin interaction
 */
interface ContextualOverlayLoaderTool {
    execute(args: { key: string, map: any }): any | null;
}

class RiskContextualizer {
    private rcdmManager: RCDMManager;
    private activeContext: string;
    private contextMapData: any;
    private overlayLoader: ContextualOverlayLoaderTool;

    constructor(rcdmManager: RCDMManager, overlayLoader: ContextualOverlayLoaderTool) {
        this.rcdmManager = rcdmManager; // Interface to modify active RCDM configuration
        // Dependency injection of the lookup utility
        this.overlayLoader = overlayLoader;
        // Configuration source is loaded during setup
        this.contextMapData = CONTEXT_MAP_DATA;
        this.activeContext = 'BASELINE';
    }

    // Removed loadContextMap; data retrieval is now delegated to the plugin

    updateContext(newContextKey: string): boolean {
        if (newContextKey !== this.activeContext) {
            
            // Use the extracted plugin to retrieve the overlay configuration
            const overlay = this.overlayLoader.execute({
                key: newContextKey,
                map: this.contextMapData
            });

            if (overlay) {
                // Apply dynamic update via the RCDM manager interface
                this.rcdmManager.applyConfigOverlay(overlay);
                this.activeContext = newContextKey;
                console.log(`RCDM context updated to: ${newContextKey}`);
                return true;
            }
            return false;
        }
        return false;
    }

    // Method to continuously evaluate external signals (e.g., monitoring queues, API)
    monitorSignals() {
        // Logic to decide if a context switch is required
        // Example: if (ExternalThreatLevel.get() > 5) { this.updateContext('HIGH_SECURITY_MISSION'); }
    }
}

module.exports = RiskContextualizer;
