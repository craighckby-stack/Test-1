// Purpose: Ensures deterministic serialization and accurate integrity hash computation for SSVR documents.

import { CanonicalSerializationUtility } from '@@/plugin/CanonicalSerializationUtility';
import { DocumentIntegrityHashUtility } from '@@/plugin/DocumentIntegrityHashUtility';

// Assuming a standard configuration for SSVR hashing
const HASH_ALGORITHM = 'SHA-384';
// Fields that must be excluded from the hash computation
const SSVR_EXCLUSION_FIELDS = ['integrity_hash', 'attestation_log'];

/**
 * SSVR Canonicalizer Module
 * Ensures all key/value pairs within the JSON structure are sorted alphabetically
 * and serialized according to the SSVR strict canonical JSON format.
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
 * Leverages the DocumentIntegrityHashUtility for the complete workflow (Exclusion -> Canonicalization -> Hashing).
 * 
 * @param {object} ssvrData - The SSVR object.
 * @returns {string} - The SHA-384 hash.
 */
export function calculateIntegrityHash(ssvrData: object): string {
    return DocumentIntegrityHashUtility.hash({
        data: ssvrData,
        excludeFields: SSVR_EXCLUSION_FIELDS,
        hashAlgorithm: HASH_ALGORITHM
    });
}