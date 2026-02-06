const crypto = require('crypto');

/**
 * core/utils/Cryptography/IntegrityHasher.js
 * 
 * Standardized utility for calculating content integrity hashes 
 * adhering to Sovereign AGI protocol specifications (defaulting to SHA-256).
 * This service abstracts the Node `crypto` module, allowing the indexing service 
 * to switch algorithms (e.g., to BLAKE3) without modification.
 */
class IntegrityHasher {
    constructor(algorithm = 'sha256') {
        // Normalize algorithm name and ensure support check (optional, but good practice)
        this.algorithm = algorithm.toLowerCase();
    }

    /**
     * Returns the name of the algorithm being used.
     * @returns {string}
     */
    getAlgorithmName() {
        return this.algorithm.toUpperCase();
    }

    /**
     * Calculates the hash of the provided content buffer.
     * @param {Buffer|string} content
     * @returns {string} The hash digest in hex format.
     */
    calculate(content) {
        if (!(content instanceof Buffer)) {
            content = Buffer.from(content);
        }
        
        const hash = crypto.createHash(this.algorithm);
        hash.update(content);
        return hash.digest('hex');
    }
}

module.exports = IntegrityHasher;