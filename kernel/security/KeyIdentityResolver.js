/**
 * AGI-KERNEL v7.9.2 - kernel/security/KeyIdentityResolver.js
 * Resolves cryptographic keys or tokens to secure identity objects, utilizing
 * the KeyCachePlugin for high-performance, abstracted memoization (LRU cache).
 */

import { KeyCachePlugin } from "../core/KeyCachePlugin";

/**
 * Represents a basic identity structure (for resolution result).
 * @typedef {Object} IdentityPrincipal
 * @property {string} userId
 * @property {string[]} roles
 * @property {number} issuedAt
 */

class KeyIdentityResolver {
    /**
     * @param {Object} backingStore - An object implementing an async lookup(key) method.
     * @param {number} cacheSize - Maximum number of identities to cache (LRU).
     * @param {number} ttl - Time-to-live in milliseconds for cache entries.
     */
    constructor(backingStore, cacheSize = 512, ttl = 300000) {
        if (!backingStore || typeof backingStore.lookup !== 'function') {
            throw new Error("Backing store must implement an async lookup method.");
        }
        this.backingStore = backingStore;
        // Abstracting caching complexity into the KeyCachePlugin for O(1) operations
        this.cache = new KeyCachePlugin({
            maxSize: cacheSize,
            ttl: ttl
        });
    }

    /**
     * Resolves a cryptographic key or token into a secure IdentityPrincipal.
     * Prioritizes cache lookup for maximum efficiency.
     * 
     * @param {string} key - The key, hash, or token to resolve.
     * @returns {Promise<IdentityPrincipal | null>}
     */
    async resolve(key) {
        // 1. Check Cache (O(1))
        const cachedIdentity = this.cache.get(key);
        if (cachedIdentity !== undefined) {
            return cachedIdentity;
        }

        // 2. Lookup in Backing Store (Async I/O)
        try {
            const identity = await this.backingStore.lookup(key);

            // 3. Cache Result and Return
            if (identity) {
                // Ensure identity structure is valid before caching
                if (identity.userId) {
                    this.cache.set(key, identity);
                    return identity;
                }
            }
            
            // Cache failed resolutions temporarily to prevent DOS attacks (optional optimization)
            this.cache.set(key, null, 60000); // Cache 'null' results for 1 minute
            return null;

        } catch (error) {
            console.error(`Key resolution failed for key: ${key.substring(0, 10)}...`, error);
            return null;
        }
    }

    /**
     * Clears all entries from the internal cache.
     */
    clearCache() {
        this.cache.clear();
    }
}

export { KeyIdentityResolver };