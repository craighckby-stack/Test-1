/**
 * @file IntegrityMonitor.js
 * @description Core utility for TEDS hash calculation and cross-stage artifact integrity validation.
 * Ensures standard SHA-256 application across all GSEP-C agents (CRoT, GAX, SGS).
 */

import { createHash } from 'crypto';

// --- AGI Kernel Plugin Interface Proxy ---
// Helper to invoke the extracted utility tool.
// NOTE: In the AGI-KERNEL runtime, this function is mapped to the compiled plugin execution.
function runCanonicalIntegrityHasher(data, createHashFn) {
  // Simulate access to the CanonicalIntegrityHasher tool
  const HashingTool = AGI_KERNEL.getPlugin('CanonicalIntegrityHasher');
  
  return HashingTool.execute({ data: data, createHashFn: createHashFn });
}
// ------------------------------------------

/**
 * Generates a standard SHA-256 hash for an input artifact or data structure using
 * the CanonicalIntegrityHasher tool, ensuring canonical serialization for objects.
 * 
 * @param {string|Buffer|object} data - The data payload to hash.
 * @returns {string} The SHA-256 hash in lowercase hex format.
 */
export function calculateArtifactHash(data) {
  // Delegation to the CanonicalIntegrityHasher plugin, passing 'createHash' as a required dependency.
  return runCanonicalIntegrityHasher(data, createHash);
}

/**
 * Validates if the recorded TEDS hash matches the provided artifact.
 * @param {string} recordedHash - The hash stored in the TEDS record.
 * @param {string|Buffer|object} artifact - The artifact data to re-check.
 * @returns {boolean} True if hashes match, false otherwise.
 */
export function validateTedsIntegrity(recordedHash, artifact) {
  const calculatedHash = calculateArtifactHash(artifact);
  return recordedHash.toLowerCase() === calculatedHash;
}

// Placeholder export for cross-stage comparison logic (S03 Input vs S05 Output)
export function compareStageArtifacts(hashA, hashB) {
  return hashA.toLowerCase() === hashB.toLowerCase();
}