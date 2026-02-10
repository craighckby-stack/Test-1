const { CanonicalIntegrityHasher } = require('../plugins/CanonicalIntegrityHasher');

/**
 * Utility module for generating cryptographic hashes used in versioning and integrity checks.
 * Delegates hashing responsibility to the CanonicalIntegrityHasher plugin for robust, content-aware versioning.
 */
class IntegrityUtils {
    /**
     * Calculates the SHA-256 hash of provided content.
     * @param {(string|object)} content - The content to hash. If an object, it is JSON.stringified.
     * @returns {Promise<string>} The SHA-256 hash digest (hexadecimal).
     */
    static async calculateContentHash(content) {
        // Delegate the core hashing logic to the centralized, testable plugin.
        return CanonicalIntegrityHasher.calculateHash(content);
    }
}

module.exports = IntegrityUtils;