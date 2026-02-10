/**
 * Hashing Utility Service
 * Provides standardized, cryptographic hashing capabilities necessary for 
 * integrity verification across the governance and transaction layers, leveraging
 * the Canonical Crypto Utility for deterministic serialization and hashing.
 */

import { CanonicalCryptoUtility } from '@agi-kernel/plugins'; // Use the established plugin interface

/**
 * Generates a SHA256 hash of the input data.
 * Supports complex objects by stably serializing them first.
 * 
 * @param {*} data - The input data (string or object) to be hashed.
 * @param {string} [algorithm='sha256'] - The hashing algorithm to use.
 * @returns {string} The hexadecimal hash digest.
 */
export function calculateHash(data, algorithm = 'sha256') {
    // Delegate the complex logic (serialization + hashing) to the reusable plugin
    
    // Note: The specific implementation details (Node.js crypto vs Web Crypto) are now abstracted
    // within the CanonicalCryptoUtility plugin.

    if (!CanonicalCryptoUtility || typeof CanonicalCryptoUtility.calculateHash !== 'function') {
        throw new Error("CanonicalCryptoUtility plugin is required but unavailable or improperly initialized.");
    }

    return CanonicalCryptoUtility.calculateHash(data, algorithm);
}