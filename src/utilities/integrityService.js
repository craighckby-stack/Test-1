// src/utilities/integrityService.js
// Provides standard cryptographic hashing for integrity checks and chain linkage.

const crypto = require('crypto');

class IntegrityService {
    /**
     * Calculates a stable, consistent SHA-256 hash for any data structure.
     * Keys are sorted recursively before serialization to ensure stability across platforms.
     * @param {object|string} data 
     * @returns {string} SHA-256 hash in hexadecimal format
     */
    calculateStableHash(data) {
        let dataToHash;

        if (typeof data === 'string') {
            dataToHash = data;
        } else {
            // Use JSON.stringify replacer function to ensure keys are sorted
            dataToHash = JSON.stringify(data, (key, value) => {
                // Only attempt to sort plain objects (not arrays, Date, or primitives)
                if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    return Object.keys(value).sort().reduce((sorted, k) => {
                        sorted[k] = value[k];
                        return sorted;
                    }, {});
                }
                return value;
            });
        }

        return crypto.createHash('sha256').update(dataToHash).digest('hex');
    }
}

module.exports = IntegrityService;