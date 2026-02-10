const fs = require('fs');
const crypto = require('crypto');

/**
 * Manages the calculation and verification of file integrity hashes using streaming.
 * Supports large files efficiently by avoiding loading the entire file into memory.
 */
class FileIntegrityManager {

    /**
     * Calculates the cryptographic hash of a file.
     * @param {string} filePath - The path to the file.
     * @param {string} [algorithm='sha256'] - The hashing algorithm (e.g., 'sha256', 'md5').
     * @returns {Promise<string>} The calculated hash in hex format.
     */
    static calculateHash(filePath, algorithm = 'sha256') {
        return new Promise((resolve, reject) => {
            let stream;
            try {
                const hash = crypto.createHash(algorithm);
                stream = fs.createReadStream(filePath);

                stream.on('error', (err) => {
                    // Handle file access or read errors
                    reject(new Error(`[FileIntegrityManager] Failed to read file ${filePath}: ${err.message}`));
                });

                stream.on('data', (chunk) => {
                    hash.update(chunk);
                });

                stream.on('end', () => {
                    resolve(hash.digest('hex'));
                });
            } catch (err) {
                // Handle creation errors (e.g., unknown algorithm)
                if (stream) {
                    stream.destroy();
                }
                reject(new Error(`[FileIntegrityManager] Error initializing hash calculation for ${filePath}: ${err.message}`));
            }
        });
    }

    /**
     * Verifies if a file's content matches an expected hash.
     * @param {string} filePath - The path to the file.
     * @param {string} expectedHash - The known correct hash.
     * @param {string} [algorithm='sha256'] - The hashing algorithm.
     * @returns {Promise<boolean>} True if the hashes match, false otherwise.
     */
    static async verifyHash(filePath, expectedHash, algorithm = 'sha256') {
        try {
            const calculatedHash = await this.calculateHash(filePath, algorithm);
            return calculatedHash.toLowerCase() === expectedHash.toLowerCase();
        } catch (error) {
            // If hash calculation fails (e.g., file not found), verification implicitly fails.
            console.warn(`Verification failed due to calculation error for ${filePath}: ${error.message}`);
            return false;
        }
    }
}

module.exports = FileIntegrityManager;