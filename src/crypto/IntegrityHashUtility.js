const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// --- Configuration Constants ---
const ALGORITHM = 'sha256';
const ENCODING = 'hex';
const DIGEST_LENGTH = 64; // Length of SHA-256 hash in hex characters.

/**
 * IntegrityHashUtility
 * Provides standardized, consistent cryptographic hashing functions for
 * Governance Artifact attestation (GAX III requirement).
 * Ensures that all subsystems calculating hashes for GAR attestation use the same protocol.
 */
class IntegrityHashUtility {
    
    /**
     * Calculates the cryptographic hash of raw data (Buffer or string).
     * @param {Buffer | string} data The content to hash.
     * @returns {string} The SHA-256 hash (64 characters).
     * @throws {Error} If data is null or undefined.
     */
    static hashData(data) {
        if (data === null || data === undefined) {
            throw new Error("Cannot hash null or undefined data.");
        }
        return crypto.createHash(ALGORITHM).update(data).digest(ENCODING);
    }

    /**
     * Calculates the hash of a file synchronously.
     * WARNING: Reads the entire file into memory. Use sparingly.
     * @param {string} filePath Absolute or relative path to the file.
     * @returns {string} The SHA-256 hash.
     * @throws {Error} If file access fails.
     */
    static hashFileSync(filePath) {
        const fullPath = path.resolve(filePath);
        try {
            const data = fs.readFileSync(fullPath);
            return IntegrityHashUtility.hashData(data);
        } catch (error) {
            throw new Error(`Integrity hashing failed for file ${filePath} (${fullPath}): ${error.message}`);
        }
    }

    /**
     * Calculates the hash of a file asynchronously (preferred for large files/runtime checks).
     * @param {string} filePath Absolute or relative path to the file.
     * @returns {Promise<string>} Promise resolving to the SHA-256 hash.
     */
    static hashFileAsync(filePath) {
        const fullPath = path.resolve(filePath);
        
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(ALGORITHM);
            const stream = fs.createReadStream(fullPath);

            // Handle stream errors (e.g., file not found, permission issues)
            stream.on('error', (err) => {
                reject(new Error(`Stream error during async hash calculation for ${fullPath}: ${err.message}`));
            });

            // Pipe stream data to the hash object
            stream.on('data', (chunk) => {
                hash.update(chunk);
            });

            // Finalize calculation upon stream end
            stream.on('end', () => {
                try {
                    const result = hash.digest(ENCODING);
                    resolve(result);
                } catch (e) {
                    // Safety net for digest error
                    reject(new Error(`Hash digest calculation failed: ${e.message}`));
                }
            });
        });
    }
    
    /**
     * Validates if a calculated hash matches an expected hash.
     * Enforces consistency in integrity checks.
     * @param {string} calculatedHash The newly calculated hash.
     * @param {string} expectedHash The required hash.
     * @returns {boolean} True if the hashes match and are valid lengths.
     */
    static validateHash(calculatedHash, expectedHash) {
        if (typeof calculatedHash !== 'string' || typeof expectedHash !== 'string') {
            return false;
        }

        // Standardize validation against the defined digest length.
        if (calculatedHash.length !== DIGEST_LENGTH || expectedHash.length !== DIGEST_LENGTH) {
            return false;
        }
        
        // Standard string comparison is sufficient for file integrity verification.
        return calculatedHash === expectedHash;
    }
}

module.exports = IntegrityHashUtility;