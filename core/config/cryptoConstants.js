/**
 * core/config/cryptoConstants.js
 * 
 * Centralized configuration for cryptographic utilities, defining standard
 * algorithms and encoding protocols used across the Sovereign AGI system.
 * 
 * NOTE: These constants serve as the canonical source for default values 
 * and supported algorithms. Access and validation should typically be performed 
 * through the CanonicalCryptoConfigUtility plugin.
 */

const DEFAULT_HASH_ALGORITHM = 'sha256';
const DEFAULT_STRING_ENCODING = 'utf8';

/**
 * A standard list of supported hash algorithms for integrity checks. 
 * This list reflects current secure standards enforced by the AGI protocol.
 * @type {string[]}
 */
const SUPPORTED_INTEGRITY_ALGORITHMS = [
    'sha256',
    'sha512',
    'blake2b512'
];

module.exports = {
    DEFAULT_HASH_ALGORITHM,
    DEFAULT_STRING_ENCODING,
    SUPPORTED_INTEGRITY_ALGORITHMS
};