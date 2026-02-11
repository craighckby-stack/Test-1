/**
 * GovernanceApiAdapter.js
 * Abstraction layer for fetching dynamic governance configuration overlays.
 * This isolates network complexity (handling fetch, timeouts, error codes) 
 * from the AdaptiveConstantManager's core logic (state management and merging).
 */

// NOTE: In a real environment, NetworkFetcher would be imported or injected.
// For demonstration, we assume it is globally available or imported via require('./NetworkFetcher').

class NetworkFetcher {
    // Placeholder for the NetworkFetcher implementation (defined in the plugin section)
    async getJson(url, timeout) {
        console.log(`[NetworkFetcher:MOCK] Fetching ${url}`);
        
        if (url.includes("mock_fail")) {
             throw new Error("Simulated network failure/timeout.");
        }

        // Mocked return structure consistent with the original file's intent
        return {
            system_tuning: {
                governance_cycle_ms: 500 
            },
        };
    }
}

class GovernanceApiAdapter {
    constructor(endpoint, client = new NetworkFetcher()) {
        if (!endpoint) throw new Error("Adapter requires a configuration endpoint.");
        this.endpoint = endpoint;
        // Dependency Injection for the network client
        this.client = client;
    }

    async fetchLatestConfig() {
        console.log(`[Adapter] Attempting to fetch constants from: ${this.endpoint}`);
        
        try {
            // Utilize the abstracted network client for fetching and parsing JSON
            // Default timeout set to 5000ms
            const config = await this.client.getJson(this.endpoint, 5000);
            
            // The client handles status checking and parsing, we return the clean config object
            return config;
            
        } catch (e) {
            console.error("[Adapter] Fetch failed:", e.message);
            // Re-throw a contextualized error for upstream management
            throw new Error(`Failed to retrieve configuration: ${e.message}`);
        }
    }
}

module.exports = GovernanceApiAdapter;