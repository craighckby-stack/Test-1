/**
 * Trust Cache Manager Configuration structure.
 * @typedef {object} TrustCacheManagerConfig
 * @property {number} [ttlSeconds=300] - Time-to-live for cache entries.
 * @property {number} [cleanupIntervalSeconds=60] - How often the background cleanup runs.
 */

const TTLMapCache = require('./plugins/TTLMapCache');

const DEFAULT_TTL_SECONDS = 300; // 5 minutes
const DEFAULT_CLEANUP_INTERVAL_SECONDS = 60; // 1 minute

/**
 * Trust Cache Manager (TCM) v94.2
 * Manages the persistence and retrieval of calculated agent trust scores, implementing
 * active garbage collection via the underlying TTLMapCache utility.
 */
class TrustCacheManager {
    /**
     * @param {TrustCacheManagerConfig} [config={}] - Configuration object.
     */
    constructor(config = {}) {
        // Resolve configuration with defaults
        const resolvedConfig = {
            ttlSeconds: DEFAULT_TTL_SECONDS,
            cleanupIntervalSeconds: DEFAULT_CLEANUP_INTERVAL_SECONDS,
            ...config
        };

        const ttlMs = resolvedConfig.ttlSeconds * 1000;
        const cleanupIntervalMs = resolvedConfig.cleanupIntervalSeconds * 1000;
        
        /** @type {TTLMapCache<string, number>} */
        this._cache = new TTLMapCache(ttlMs, cleanupIntervalMs);
    }

    /**
     * Generates a standardized cache key based on Agent ID and Context.
     * Normalizes the context to ensure consistent key usage (trimmed, uppercase).
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     * @returns {string}
     */
    _generateKey(agentId, currentContext = 'GLOBAL') {
        if (!agentId || typeof agentId !== 'string') {
            throw new Error("TCM Error: Agent ID must be a non-empty string.");
        }
        
        const context = (currentContext || 'GLOBAL').trim().toUpperCase();
        return `${agentId}:${context}`;
    }

    /**
     * Stores a calculated trust score with an expiration time.
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     * @param {number} score - The calculated PME score.
     */
    setScore(agentId, currentContext = 'GLOBAL', score) {
        if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
            throw new TypeError("TCM Error: Score must be a valid, finite number.");
        }

        const key = this._generateKey(agentId, currentContext);
        
        this._cache.set(key, score);
    }

    /**
     * Retrieves a score from the cache if it is valid (not expired).
     * Implements lazy expiration check/cleanup.
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     * @returns {number|null} The cached score, or null if missing/expired.
     */
    getScore(agentId, currentContext = 'GLOBAL') {
        try {
            const key = this._generateKey(agentId, currentContext);
            const score = this._cache.get(key);

            // TTLMapCache returns undefined if missing/expired, map back to null for API consistency
            return score !== undefined ? score : null;
            
        } catch (e) {
            // Gracefully handle errors from _generateKey (e.g., invalid Agent ID)
            return null; 
        }
    }

    /**
     * Forces the invalidation of a specific score entry.
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     */
    invalidate(agentId, currentContext = 'GLOBAL') {
        try {
            const key = this._generateKey(agentId, currentContext);
            this._cache.delete(key);
        } catch (e) {
            // Ignore invalidation attempts based on bad input keys
        }
    }

    /**
     * Returns the current size of the cache (including potentially expired items).
     */
    size() {
        return this._cache.size();
    }

    /**
     * Stops the background cleanup interval task. Essential for clean system shutdown.
     */
    stop() {
        this._cache.stopCleanup();
    }
}

module.exports = TrustCacheManager;