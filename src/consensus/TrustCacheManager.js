/**
 * @typedef {object} CacheEntry
 * @property {number} score - The calculated trust score.
 * @property {number} expiry - Unix timestamp in milliseconds when the entry expires.
 */

/**
 * Trust Cache Manager Configuration structure.
 * @typedef {object} TrustCacheManagerConfig
 * @property {number} [ttlSeconds=300] - Time-to-live for cache entries.
 * @property {number} [cleanupIntervalSeconds=60] - How often the background cleanup runs.
 */

/**
 * Trust Cache Manager (TCM) v94.1
 * Manages the persistence and retrieval of calculated agent trust scores, implementing
 * active garbage collection for bounded memory usage and configurable lifetime.
 */
class TrustCacheManager {
    /**
     * @param {TrustCacheManagerConfig} [config={}] - Configuration object.
     */
    constructor(config = {}) {
        /** @type {Map<string, CacheEntry>} */
        this.cache = new Map();

        // Default configuration settings and merging provided configuration
        const defaultConfig = {
            ttlSeconds: 300,
            cleanupIntervalSeconds: 60,
        };

        this.config = { ...defaultConfig, ...config };
        
        this.ttl = this.config.ttlSeconds * 1000; // ms
        this.cleanupInterval = this.config.cleanupIntervalSeconds * 1000; // ms
        
        this.cleanupTimer = null; 

        this._startCleanupTask();
    }

    /**
     * Initializes the periodic background task for cache cleanup.
     * Prevents unbounded memory growth from unread, expired entries.
     * @private
     */
    _startCleanupTask() {
        if (this.cleanupInterval > 0) {
            this.cleanupTimer = setInterval(() => {
                this._runCleanup();
            }, this.cleanupInterval);
            
            // Ensure timer does not block process exit in compatible environments
            if (this.cleanupTimer.unref) {
                this.cleanupTimer.unref(); 
            }
        }
    }

    /**
     * Clears all expired entries from the cache in one pass.
     * @private
     * @returns {number} The number of items cleaned.
     */
    _runCleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiry < now) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }

    /**
     * Generates a standardized cache key based on Agent ID and Context.
     * @param {string} agentId 
     * @param {string} currentContext 
     * @returns {string}
     */
    _generateKey(agentId, currentContext = 'GLOBAL') {
        if (!agentId || typeof agentId !== 'string') {
            throw new Error("Agent ID must be a valid string.");
        }
        return `${agentId}:${currentContext}`;
    }

    /**
     * Stores a calculated trust score with an expiration time.
     * @param {string} agentId 
     * @param {string} currentContext 
     * @param {number} score - The calculated PME score.
     */
    setScore(agentId, currentContext, score) {
        if (typeof score !== 'number' || isNaN(score)) {
            throw new TypeError("Score must be a valid number.");
        }

        const key = this._generateKey(agentId, currentContext);
        const expiry = Date.now() + this.ttl;
        
        /** @type {CacheEntry} */
        const entry = { score, expiry };

        this.cache.set(key, entry);
    }

    /**
     * Retrieves a score from the cache if it is valid (not expired).
     * @param {string} agentId 
     * @param {string} currentContext 
     * @returns {number|null} The cached score, or null if missing/expired.
     */
    getScore(agentId, currentContext) {
        const key = this._generateKey(agentId, currentContext);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (entry.expiry < now) {
            // Lazy expiration check & cleanup (handles missed cleanup cycles)
            this.cache.delete(key);
            return null;
        }

        return entry.score;
    }

    /**
     * Forces the invalidation of a specific score entry.
     * @param {string} agentId 
     * @param {string} currentContext 
     */
    invalidate(agentId, currentContext = 'GLOBAL') {
        try {
            const key = this._generateKey(agentId, currentContext);
            this.cache.delete(key);
        } catch (e) {
            // Ignore invalidation errors if key generation fails
        }
    }

    /**
     * Returns the current size of the cache (including potentially expired items).
     */
    size() {
        return this.cache.size;
    }

    /**
     * Stops the background cleanup interval task. Essential for clean system shutdown.
     */
    stop() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
}

module.exports = TrustCacheManager;
