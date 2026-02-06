/**
 * E-01: External Policy Index (EPI)
 * Role: Provides a robust, read-only, synchronous interface to access verified, immutable external policies (compliance, mandates, kill-switches).
 * Mechanism: Manages periodic, cryptographically verified updates in the background to ensure high availability and minimal latency for Veto checks.
 */
class ExternalPolicyIndex {
    /**
     * @param {Object} config
     * @param {string} config.sourceUrl - URL of the centralized governance feed.
     * @param {number} [config.cacheDurationMs=3600000] - Duration in milliseconds for cache renewal.
     * @param {Object} config.PolicyFetcher - Dependency Injection for the secure fetch utility.
     */
    constructor({ sourceUrl, cacheDurationMs = 3600000, PolicyFetcher }) {
        if (!PolicyFetcher || typeof PolicyFetcher.fetch !== 'function' || !sourceUrl) {
            throw new Error("E-01: EPI must be initialized with sourceUrl and a reliable PolicyFetcher utility.");
        }
        
        this.sourceUrl = sourceUrl;
        this.cacheDurationMs = cacheDurationMs;
        this.fetcher = PolicyFetcher;

        this.policyCache = {}; // The critical synchronous state storage
        this.lastFetchTime = 0;
        this.refreshIntervalHandle = null;
        this.isInitialized = false;
    }

    /**
     * Starts the initial fetch and sets up the background periodic cache refresh.
     */
    async initialize() {
        if (this.isInitialized) return;
        
        // Immediate initial load (critical step 1)
        await this._fetchAndSetPolicies(true);
        
        // Set up the periodic background refresh task (critical step 2)
        this.refreshIntervalHandle = setInterval(() => {
            this._fetchAndSetPolicies(false);
        }, this.cacheDurationMs);

        this.isInitialized = true;
        console.log(`E-01 Index initialized. Background refresh set for every ${this.cacheDurationMs / 1000}s.`);
    }

    /**
     * Stops the periodic cache refresh.
     */
    stop() {
        if (this.refreshIntervalHandle) {
            clearInterval(this.refreshIntervalHandle);
            this.refreshIntervalHandle = null;
            this.isInitialized = false;
            console.log('E-01 Index refresh interval stopped.');
        }
    }

    async _fetchAndSetPolicies(initialLoad = false) {
        const fetchStartTime = Date.now();
        try {
            const externalMandates = await this.fetcher.fetch(this.sourceUrl);
            
            // Atomically update the synchronous state
            this.policyCache = this._parseMandates(externalMandates);
            this.lastFetchTime = fetchStartTime;
            
            console.log('E-01 Cache updated successfully.');
            return true;
        } catch (error) {
            if (initialLoad) {
                // On critical failure during initial boot, enforce the maximum caution policy.
                console.error("E-01 CRITICAL FAILURE: Cannot load initial policies. Enforcing failsafe freeze.", error);
                this.policyCache = { globalFreeze: true }; 
            } else {
                 console.error(`E-01: Background policy fetch failed. Relying on existing cache (last fetched: ${new Date(this.lastFetchTime).toISOString()}).`, error);
            }
            return false;
        }
    }

    _parseMandates(rawData) {
        // Logic to extract mandatory veto conditions (e.g., 'SYSTEM_FREEZE', 'REGULATORY_HALT')
        // Use Object.freeze to ensure immutability once loaded into the cache.
        return Object.freeze(rawData.mandates || {});
    }

    /**
     * @param {Object} proposalMetadata - Metadata describing the proposed change (e.g., area of modification, target).
     * @returns {boolean} True if a mandatory external veto applies. CRITICAL: This MUST be synchronous and fast.
     */
    isVetoRequired(proposalMetadata) {
        if (!this.isInitialized) {
            // System queried before initialization completes. Default to maximum caution.
            console.warn("E-01 queried before initialization. Veto enforced (Fail-Safe Mode). This state should be rare.");
            return true; 
        }

        const policy = this.policyCache;
        
        // 1. Global Mandates (Highest Precedence)
        if (policy.globalFreeze === true) {
            return true; 
        }
        
        // Implementation details for more nuanced policy enforcement would go here
        // Example: if (policy.restrictedAreas.includes(proposalMetadata.target)) return true;
        
        return false;
    }
}

module.exports = ExternalPolicyIndex;