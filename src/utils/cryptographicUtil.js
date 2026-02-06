const crypto = require('crypto');

/**
 * Utility for providing standardized cryptographic operations across the AGI architecture.
 * Ensures consistent hashing for integrity checks, immutability validation, and security.
 */
export class CryptographicUtil {
    
    /**
     * Generates a deterministic SHA-256 hash of a JavaScript object/payload.
     * Ensures objects are standardized (sorted keys) before serialization to guarantee
     * consistent hashing regardless of property insertion order, vital for detecting tampering.
     * 
     * @param {Object} data - The data object to hash (e.g., proposal payload or config file).
     * @returns {string} The SHA-256 hash in hex format.
     */
    static hashObject(data) {
        if (typeof data === 'undefined' || data === null) {
            return crypto.createHash('sha256').update('').digest('hex');
        }

        // Standardize serialization by sorting keys recursively to ensure deterministic output
        const sortedJsonString = JSON.stringify(data, (key, value) => {
            if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
                const sortedKeys = Object.keys(value).sort();
                return sortedKeys.reduce((sorted, k) => {
                    sorted[k] = value[k];
                    return sorted;
                }, {});
            }
            return value;
        });

        return crypto.createHash('sha256').update(sortedJsonString, 'utf8').digest('hex');
    }

    /**
     * Generates a strong random token.
     * @param {number} length - Length of the token in bytes (defaults to 32).
     * @returns {string} Hex encoded random bytes.
     */
    static generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}