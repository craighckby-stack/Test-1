/**
 * Centralized configuration for consensus-critical parameters.
 * This ensures that cryptographic primitives and network standards
 * are consistently applied across all components (e.g., Canonicalizer, P2P network).
 */
const ConsensusConfig = {
    // Standard hashing algorithm used for state roots and block headers
    HASH_ALGORITHM: 'sha256',
    
    // Standard signature algorithm (e.g., for transaction signing)
    SIGNATURE_ALGORITHM: 'ed25519',
    
    // Default timeout for consensus rounds (in milliseconds)
    CONSENSUS_TIMEOUT_MS: 5000
};

module.exports = ConsensusConfig;