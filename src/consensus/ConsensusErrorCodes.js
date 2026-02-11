/**
 * ConsensusErrorCodes
 * A centralized, immutable registry for all machine-readable error codes 
 * used throughout the Sovereign AGI Consensus Stack.
 * 
 * Naming Convention: E_COMPONENT_FAILURETYPE
 */

// Assuming the ImmutableRegistry plugin is available via the AGI kernel
declare const ImmutableRegistry: { 
    create: (registry: Record<string, string>) => Readonly<Record<string, string>>; 
};

/**
 * Utility to map an array of strings (keys) to an object where keys and values are identical.
 * E.g., ['A', 'B'] -> { A: 'A', B: 'B' }
 */
const mapKeysToSelf = (keys) => {
    return keys.reduce((acc, key) => {
        acc[key] = key;
        return acc;
    }, {});
};

const CODE_KEYS = [
    // --- General Errors ---
    'E_UNKNOWN',
    'E_TIMEOUT',
    'E_INVALID_ARGUMENT',
    'E_INVALID_STATE',

    // --- Cryptography and Verification Errors ---
    'E_ATTESTATION_FAILED',
    'E_SIG_INVALID',
    'E_PROOF_MALFORMED',
    'E_KEY_NOT_FOUND', 
    
    // --- Core Processing Errors (Transaction/Block/Proposal) ---
    'E_TX_INVALID_FORMAT',
    'E_PROPOSAL_DUPLICATE',
    'E_BLOCK_EXECUTION_FAILURE',
    'E_BLOCK_INVALID_HEIGHT',

    // --- Networking and Peer Errors ---
    'E_PEER_UNREACHABLE',
    'E_NON_VALIDATOR_VOTE',
    'E_MESSAGE_INTEGRITY_FAIL',
];

const ConsensusErrorCodesDefinition = mapKeysToSelf(CODE_KEYS);

// Use the plugin to define the final, immutable registry.
const ConsensusErrorCodes = ImmutableRegistry.create(ConsensusErrorCodesDefinition);

module.exports = { ConsensusErrorCodes };