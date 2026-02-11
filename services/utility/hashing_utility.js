/**
 * Hashing Utility Service
 * Provides standardized, cryptographic hashing capabilities necessary for 
 * integrity verification across the governance and transaction layers, leveraging
 * the Canonical Crypto Utility for deterministic serialization and hashing.
 */

import { CanonicalCryptoUtility } from '@agi-kernel/plugins'; // Use the established plugin interface

const PLUGIN_ERROR_MESSAGE = 
    "CanonicalCryptoUtility plugin is required but unavailable or improperly initialized.";

/**
 * Generates a cryptographic hash of the input data.
 * Supports complex objects by stably serializing them first via the underlying utility.
 * 
 * @param {*} data - The input data (string, object, buffer) to be hashed.
 * @param {string} [algorithm='sha256'] - The hashing algorithm to use (e.g., 'sha256', 'sha512').
 * @returns {string} The hexadecimal hash digest.
 * @throws {Error} If the CanonicalCryptoUtility plugin is not available.
 */
export function calculateHash(data, algorithm = 'sha256') {
    // Delegate the complex logic (serialization + hashing) to the reusable plugin
    
    if (typeof CanonicalCryptoUtility?.calculateHash !== 'function') {
        throw new Error(PLUGIN_ERROR_MESSAGE);
    }

    return CanonicalCryptoUtility.calculateHash(data, algorithm);
}