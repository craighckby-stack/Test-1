/**
 * SecurityPolicy Configuration
 * Centralized module for defining system-wide cryptographic and security parameters.
 * Ensures that mandatory algorithms, key lengths, and encoding are consistent across all modules.
 */

const SecurityPolicy = Object.freeze({
    // --- Integrity Hashing (Used primarily by IntegrityHashUtility) ---
    INTEGRITY_ALGORITHM: 'sha256',
    INTEGRITY_ENCODING: 'hex',
    // Length in characters for sha256/hex (32 bytes * 2)
    INTEGRITY_HASH_LENGTH: 64,

    // --- Other potential policies (Placeholder) ---
    // KEY_ENCRYPTION_ALGORITHM: 'aes-256-gcm',
    // MINIMUM_KEY_SIZE_BYTES: 32
});

module.exports = SecurityPolicy;
