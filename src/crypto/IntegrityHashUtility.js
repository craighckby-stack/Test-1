const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'sha256';
const ENCODING = 'hex';

/**
 * IntegrityHashUtility
 * Provides standardized, consistent cryptographic hashing functions for
 * Governance Artifact attestation (GAX III requirement).
 * Ensures that all subsystems calculating hashes for GAR attestation use the same protocol.
 */
class IntegrityHashUtility {
    
    /**
     * Calculates the hash of a file synchronously.
     * Required for fast-fail integrity checks during synchronous GAR operations.
     * @param {string} filePath Absolute or relative path to the file.
     * @returns {string} The SHA-256 hash.
     */
    static hashFileSync(filePath) {
        const fullPath = path.resolve(filePath);
        try {
            // Reading the file contents ensures the hash is based only on content, not metadata.
            const data = fs.readFileSync(fullPath);
            return IntegrityHashUtility.hashData(data);
        } catch (error) {
            throw new Error(`Hashing failure for file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Calculates the hash of raw data (Buffer or string).
     * @param {Buffer | string} data The content to hash.
     * @returns {string} The SHA-256 hash (64 characters).
     */
    static hashData(data) {
        return crypto.createHash(ALGORITHM).update(data).digest(ENCODING);
    }
    
    /**
     * Calculates the hash of a file asynchronously (preferred for large files/runtime checks).
     * @param {string} filePath Absolute or relative path to the file.
     * @returns {Promise<string>} Promise resolving to the SHA-256 hash.
     */
    static hashFileAsync(filePath) {
        return new Promise((resolve, reject) => {
            const fullPath = path.resolve(filePath);
            const hash = crypto.createHash(ALGORITHM);
            const stream = fs.createReadStream(fullPath);

            stream.on('error', (err) => {
                reject(new Error(`Stream error while hashing ${filePath}: ${err.message}`));
            });

            stream.on('data', (chunk) => {
                hash.update(chunk);
            });

            stream.on('end', () => {
                resolve(hash.digest(ENCODING));
            });
        });
    }
}

module.exports = IntegrityHashUtility;