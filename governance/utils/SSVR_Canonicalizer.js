// Purpose: Ensures deterministic serialization and accurate integrity hash computation for SSVR documents.

import { CanonicalSerializationUtility } from '@@/plugin/CanonicalSerializationUtility';
import { IntegrityHashingUtility } from '@@/plugin/IntegrityHashingUtility';

// Assuming a standard configuration for SSVR hashing
const HASH_ALGORITHM = 'SHA-384';

/**
 * SSVR Canonicalizer Module
 * Ensures all key/value pairs within the JSON structure are sorted alphabetically
 * and serialized according to the SSVR strict canonical JSON format before hashing.
 * 
 * Leverages the CanonicalSerializationUtility plugin for recursive sorting.
 * 
 * @param {object} ssvrData - The SSVR object ready for finalization.
 * @returns {string} - Canonicalized JSON string suitable for cryptographic hashing.
 */
export function canonicalize(ssvrData: object): string {
    // The plugin handles the required recursive key sorting and stringification.
    return CanonicalSerializationUtility.execute({ data: ssvrData });
}

/**
 * Calculates the integrity_hash (SHA-384) for the SSVR data.
 * Note: This function must exclude the existing `integrity_hash` and `attestation_log` fields during computation.
 * 
 * Leverages the IntegrityHashingUtility plugin for cryptographic operations.
 * 
 * @param {object} ssvrData - The SSVR object.
 * @returns {string} - The SHA-384 hash.
 */
export function calculateIntegrityHash(ssvrData: object): string {
    const hashableData = { ...ssvrData };
    
    // 1. Exclude non-hashable fields (integrity_hash and attestation_log)
    if (Object.prototype.hasOwnProperty.call(hashableData, 'integrity_hash')) {
        delete hashableData.integrity_hash;
    }
    if (Object.prototype.hasOwnProperty.call(hashableData, 'attestation_log')) {
        delete hashableData.attestation_log;
    }

    // 2. Canonicalize the remaining structure
    const canonicalString = canonicalize(hashableData);
    
    // 3. Hash the canonical string
    return IntegrityHashingUtility.hash({
        data: canonicalString,
        algorithm: HASH_ALGORITHM
    });
}