/**
 * SecurityPolicy Configuration
 * Centralized module for defining system-wide cryptographic and security parameters.
 * Ensures that mandatory algorithms, key lengths, and encoding are consistent across all modules.
 * Updated: Policies upgraded to modern AGI standards (SHA3-512, AES-256-GCM, Scrypt).
 */

const SecurityPolicy = Object.freeze({
    // --- General Standards ---
    DEFAULT_ENCODING: 'hex',
    DEFAULT_TEXT_ENCODING: 'utf8',

    // --- Policy Group: Hashing & Integrity (Used primarily by IntegrityHashUtility) ---
    INTEGRITY: Object.freeze({
        // Upgrading standard from sha256 to sha3-512 for higher AGI data integrity demands
        ALGORITHM: 'sha3-512',
        OUTPUT_ENCODING: 'hex',
        // Length for sha3-512/hex (64 bytes * 2)
        HASH_LENGTH: 128
    }),

    // --- Policy Group: Key Encryption (Symmetric/Payloads) ---
    ENCRYPTION: Object.freeze({
        // AES GCM is preferred for authenticated encryption
        ALGORITHM: 'aes-256-gcm',
        KEY_SIZE_BYTES: 32, // 256 bits
        IV_SIZE_BYTES: 12, // Standard GCM IV size
        AUTH_TAG_SIZE_BYTES: 16 // Standard GCM Auth Tag size
    }),

    // --- Policy Group: Key Derivation Function (KDF) / Password Hashing ---
    KDF: Object.freeze({
        ALGORITHM: 'scrypt',
        // Aggressive cost factors suitable for critical backends
        COST_N: 16384, // CPU/Memory Cost Factor (2^14)
        COST_R: 8, // Block Size
        COST_P: 1, // Parallelization Factor
        KEY_LENGTH: 64, // Output key length in bytes (512 bits)
        SALT_LENGTH: 16 // Recommended salt size in bytes
    })
});

module.exports = SecurityPolicy;
