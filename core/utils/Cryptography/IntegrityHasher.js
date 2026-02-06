const crypto = require('crypto');
const { Readable } = require('stream');

/**
 * core/utils/Cryptography/IntegrityHasher.js
 * 
 * Standardized utility for calculating content integrity hashes 
 * adhering to Sovereign AGI protocol specifications (defaulting to SHA-256).
 * This service abstracts the Node `crypto` module, supporting both synchronous 
 * buffer/string hashing and asynchronous stream hashing for large data efficiency.
 */
class IntegrityHasher {
    /**
     * @param {string} [algorithm='sha256'] - The hashing algorithm to use (e.g., 'sha256', 'sha512', 'blake2b512').
     * @param {string} [encoding='utf8'] - Default encoding for string inputs.
     */
    constructor(algorithm = 'sha256', encoding = 'utf8') {
        this.algorithm = algorithm.toLowerCase();
        this.encoding = encoding;
    }

    /**
     * Calculates the hash of the provided content synchronously.
     * 
     * @param {Buffer|string} content - The content to hash.
     * @returns {string} The hash digest in hex format.
     */
    calculate(content) {
        // Optimization: Handle string encoding directly without intermediate Buffer creation.
        if (typeof content === 'string') {
            return crypto.createHash(this.algorithm)
                .update(content, this.encoding)
                .digest('hex');
        }
        
        // Handle Buffer and other buffer-like objects
        return crypto.createHash(this.algorithm)
            .update(content)
            .digest('hex');
    }

    /**
     * Calculates the hash of a content stream asynchronously.
     * This is crucial for handling large files or network responses efficiently.
     * 
     * @param {Readable} stream - The readable stream containing the content.
     * @returns {Promise<string>} Resolves with the hash digest in hex format.
     */
    calculateStream(stream) {
        return new Promise((resolve, reject) => {
            if (!(stream instanceof Readable)) {
                return reject(new Error("Input must be a Readable stream."));
            }

            const hash = crypto.createHash(this.algorithm);
            
            stream.on('data', (chunk) => {
                hash.update(chunk);
            });

            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Static utility method for quick, default SHA-256 hashing.
     * 
     * @param {Buffer|string} content - The content to hash.
     * @returns {string} The hash digest in hex format.
     */
    static defaultHash(content) {
        return new IntegrityHasher('sha256').calculate(content);
    }
}

module.exports = IntegrityHasher;