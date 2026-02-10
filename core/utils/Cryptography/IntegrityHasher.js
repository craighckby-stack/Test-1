const crypto = require('crypto');
const { Readable } = require('stream');

/**
 * core/utils/Cryptography/IntegrityHasher.js
 *
 * Standardized utility for calculating content integrity hashes 
 * adhering to Sovereign AGI protocol specifications.
 * This service abstracts Node's `crypto` module, supporting both synchronous 
 * buffer/string hashing and asynchronous stream hashing for efficiency.
 */
class IntegrityHasher {
    
    // Static constants derived from system configuration standards (default to SHA-256/utf8)
    static DEFAULT_ALGORITHM = 'sha256';
    static DEFAULT_ENCODING = 'utf8';

    /**
     * @param {string} [algorithm=IntegrityHasher.DEFAULT_ALGORITHM] - The hashing algorithm to use (e.g., 'sha256', 'sha512').
     * @param {string} [encoding=IntegrityHasher.DEFAULT_ENCODING] - Default encoding for string inputs.
     */
    constructor(algorithm = IntegrityHasher.DEFAULT_ALGORITHM, encoding = IntegrityHasher.DEFAULT_ENCODING) {
        const normalizedAlgorithm = algorithm.toLowerCase();
        
        // Validate algorithm support early for robustness
        if (!crypto.getHashes().includes(normalizedAlgorithm)) {
            throw new Error(`Unsupported hash algorithm: ${algorithm}. Please check Node's supported list.`);
        }

        this.algorithm = normalizedAlgorithm;
        this.encoding = encoding;
    }

    /**
     * Calculates the hash of the provided content synchronously.
     * 
     * @param {Buffer|string|Uint8Array} content - The content to hash.
     * @returns {string} The hash digest in hex format.
     */
    calculate(content) {
        const hash = crypto.createHash(this.algorithm);

        if (typeof content === 'string') {
            hash.update(content, this.encoding);
        } else {
            // Handles Buffer, Uint8Array, DataView, etc.
            hash.update(content);
        }
        
        return hash.digest('hex');
    }

    /**
     * Calculates the hash of a content stream asynchronously using async iterators.
     * This provides a cleaner syntax than manually handling stream events.
     * 
     * @param {Readable} stream - The readable stream containing the content.
     * @returns {Promise<string>} Resolves with the hash digest in hex format.
     * @throws {Error} If the input is not a Readable stream or if hashing fails.
     */
    async calculateStream(stream) {
        if (!(stream instanceof Readable)) {
            throw new Error("Input must be a Readable stream.");
        }
        
        const hash = crypto.createHash(this.algorithm);

        try {
            // Use async iteration to process the stream chunks
            for await (const chunk of stream) {
                hash.update(chunk);
            }
            return hash.digest('hex');
        } catch (e) {
            // Re-throw any stream processing error (e.g., read failure)
            throw e;
        }
    }

    /**
     * Static utility method for quick, default SHA-256 hashing.
     * Optimized to avoid class instantiation overhead.
     * 
     * @param {Buffer|string|Uint8Array} content - The content to hash.
     * @returns {string} The hash digest in hex format.
     */
    static defaultHash(content) {
        const hash = crypto.createHash(IntegrityHasher.DEFAULT_ALGORITHM);

        if (typeof content === 'string') {
            hash.update(content, IntegrityHasher.DEFAULT_ENCODING);
        } else {
            hash.update(content);
        }

        return hash.digest('hex');
    }
}

module.exports = IntegrityHasher;