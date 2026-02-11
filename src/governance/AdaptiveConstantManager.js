// src/governance/AdaptiveConstantManager.js

// Manages and merges static governance constants with dynamic, runtime-adjusted overlays.
// This service ensures that system constants can be tuned by external or self-tuning agents
// based on real-time performance data, providing maximum operational efficiency without restarts.

const STATIC_CONSTANTS = require('../../config/governance_constants_v2.json');

// NOTE ON DEPENDENCIES:
// 1. deepMerge is assumed to be available (e.g., via ConfigurationMerger plugin).
// 2. PollingConfigurationSource is provided by the extracted plugin logic.

// --- Local Mock/Dependency Stubs (for initialization when not injected) ---
// This mock simulates the required network adapter behavior (GovernanceApiAdapter).
const mockGovernanceFetcher = async (endpoint) => {
    // Placeholder simulation:
    await new Promise(resolve => setTimeout(resolve, 50)); 
    return { 
        system_tuning: { last_check: Date.now() },
        execution_policy: { max_recursion_depth: 60 } 
    };
};

// Assume PollingConfigurationSource is available globally or injected for operational code.
let PollingConfigurationSource = global.PollingConfigurationSource; 
// ---------------------------------------------------------------------------

class AdaptiveConstantManager {
    // Dependencies can be injected for testing/strict environments, or defaults used.
    constructor(deps = {}) {
        this.deepMerge = deps.deepMerge || (typeof deepMerge !== 'undefined' ? deepMerge : null);
        this.PollingSource = deps.PollingSource || PollingConfigurationSource;
        this.fetcher = deps.fetcher || mockGovernanceFetcher;

        if (!this.deepMerge) {
            throw new Error("AdaptiveConstantManager requires 'deepMerge' utility.");
        }
        
        // Initialize config with a deep copy of static constants
        this.currentConfig = this.deepMerge({}, STATIC_CONSTANTS);
        this.dynamicSource = null; 

        const overlaySource = this.getConstant('dynamic_overlay_source');
        
        if (overlaySource && overlaySource.enabled) {
            this.setupDynamicFetching(overlaySource);
        }
    }

    setupDynamicFetching(source) {
        if (!this.PollingSource) {
            console.warn('Dynamic constant fetching disabled: PollingConfigurationSource dependency missing.');
            return;
        }

        const fallbackInterval = this.getConstant('governance_intervals.telemetry_reporting_ms') || 15000; 

        // The entire polling, network scheduling, and error handling complexity is now abstracted 
        // into the PollingConfigurationSource plugin.
        this.dynamicSource = new this.PollingSource(
            source, 
            this.fetcher, 
            (newConfig) => this.mergeConfig(newConfig), // Success Callback
            fallbackInterval
        );

        this.dynamicSource.start();
    }

    mergeConfig(overlay) {
        // Use dedicated deepMerge utility for robust, nested configuration updates.
        const prevConfigJson = JSON.stringify(this.currentConfig); // Snapshot for comparison
        this.currentConfig = this.deepMerge(this.currentConfig, overlay);
        
        if (prevConfigJson !== JSON.stringify(this.currentConfig)) {
            console.log('[ACL] Governance constants updated dynamically. Configuration delta applied.');
        }
    }

    getConstant(path) {
        // Utility to retrieve a nested constant safely, returning undefined on failure.
        if (!path || typeof path !== 'string') return undefined;

        try {
            return path.split('.').reduce((o, i) => {
                // Ensure object exists before accessing property
                if (!o || typeof o !== 'object') return undefined;
                return o[i];
            }, this.currentConfig);
        } catch (e) {
            console.error(`Error during constant retrieval for path: ${path}`, e.message);
            return undefined;
        }
    }

    stop() {
        if (this.dynamicSource) {
            this.dynamicSource.stop();
            this.dynamicSource = null;
            console.log('AdaptiveConstantManager polling management stopped.');
        }
    }
}

// Export a robust singleton instance
// Note: Dependencies (like deepMerge, PollingSource) must be available in the execution context.
module.exports = new AdaptiveConstantManager({});