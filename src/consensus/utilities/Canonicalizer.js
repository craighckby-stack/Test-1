const crypto = require('crypto');

/**
 * Utility for ensuring deterministic state serialization and secure hashing.
 * Essential for cryptographic integrity checks across distributed sovereign nodes.
 * Ensures that complex objects yield the exact same hash across all nodes.
 */
class Canonicalizer {

    /**
     * Converts a complex object into a deterministically ordered JSON string 
     * suitable for hashing/signing.
     * @param {object} data 
     * @returns {string} Canonical JSON string.
     */
    static canonicalize(data) {
        // Uses a replacer function to guarantee that object keys are always sorted, 
        // ensuring deterministic JSON serialization regardless of original insertion order.
        return JSON.stringify(data, (key, value) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Create a new object with sorted keys
                return Object.keys(value).sort().reduce((sorted, k) => {
                    sorted[k] = value[k];
                    return sorted;
                }, {});
            }
            return value;
        });
    }

    /**
     * Calculates a secure cryptographic hash of the canonical data.
     * @param {string} canonicalData - Data obtained from canonicalize().
     * @param {string} algorithm - Hashing algorithm (e.g., 'sha256', 'blake3').
     * @returns {string} Hexadecimal hash digest.
     */
    static hash(canonicalData, algorithm = 'sha256') {
        return crypto
            .createHash(algorithm.toLowerCase())
            .update(canonicalData)
            .digest('hex');
    }
}

module.exports = Canonicalizer;