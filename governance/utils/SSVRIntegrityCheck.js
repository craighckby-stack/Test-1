/**
 * SSVRIntegrityCheck.js
 * ----------------------------------------------------
 * Core utility for validating the Schema Version Registry (SSVR)
 * during system initialization against physical governance files and digital attestations.
 *
 * Refactor V94.1 Changes:
 * 1. Decoupled integrity policy: Required signers and hash types are now dynamically loaded from a governance configuration file (`IntegrityPolicy.json`).
 * 2. Safer Self-Integrity Check: Self-hashing logic avoids dangerous raw string replacement, instead relying on manipulation of the parsed object and canonicalization for cryptographic integrity.
 * 3. Enhanced Error Reporting: Detailed context included in exceptions for easier debugging during system failure.
 * 4. Cleaner Entry Point: Removed redundant 'rawSSVRString' argument from runFullCheck.
 */

import { CRoTCrypto } from 'core/crypto/CRoT';
import { SystemFiles } from 'core/system/filesystem';

const INTEGRITY_POLICY_PATH = 'governance/config/IntegrityPolicy.json';
let integrityPolicy = null;

class SSVRIntegrityCheck {
  constructor(ssvrContent) {
    if (!ssvrContent || typeof ssvrContent !== 'object' || !ssvrContent.integrity_hash) {
      throw new Error("SSVR Validation Setup Error: Invalid SSVR object provided. Missing content or integrity hash.");
    }
    this.ssvr = ssvrContent;
  }

  /**
   * Helper function to safely load configuration only once.
   */
  static async loadIntegrityPolicy() {
    if (!integrityPolicy) {
        try {
            const policyContent = await SystemFiles.read(INTEGRITY_POLICY_PATH);
            integrityPolicy = JSON.parse(policyContent).SSVR;
        } catch (e) {
            throw new Error(`Integrity Policy Load Failure: Could not load configuration from ${INTEGRITY_POLICY_PATH}: ${e.message}`);
        }
    }
    return integrityPolicy;
  }

  /**
   * Helper function to generate a canonical JSON string excluding the integrity_hash field.
   * This ensures deterministic input for hashing regardless of property order during parsing.
   */
  _createHashableSSVRContent() {
    const tempSSVR = JSON.parse(JSON.stringify(this.ssvr)); // Deep clone
    delete tempSSVR.integrity_hash;

    // Assume CRoTCrypto or the platform provides a canonical stringify method
    // for cryptographically reliable JSON serialization (e.g., RFC 8785 standard).
    return (CRoTCrypto.stringifyCanonical || JSON.stringify)(tempSSVR);
  }

  /**
   * Step 1: Verify the top-level integrity hash of the SSVR document itself.
   */
  async verifySelfIntegrity() {
    const hashableContent = this._createHashableSSVRContent();
    const policy = await SSVRIntegrityCheck.loadIntegrityPolicy();
    const hashAlgorithm = policy.hash_algorithm || 'SHA-256';

    const calculatedHash = await CRoTCrypto.hash(hashableContent, hashAlgorithm);
    
    if (calculatedHash !== this.ssvr.integrity_hash) {
      const hashPrefix = calculatedHash.substring(0, 10);
      throw new Error(`SSVR Integrity Failure (Self Check): Calculated hash (${hashPrefix}...) does not match stored integrity_hash for version ${this.ssvr.version}.`);
    }
    return true;
  }

  /**
   * Step 2: Verify the hashes of all external schemas referenced in the registry
   * by recalculating their content hash upon runtime loading.
   */
  async verifySchemaContentHashes() {
    const results = await Promise.all(this.ssvr.schema_definitions.map(async (schemaDef) => {
      const schemaId = schemaDef.schema_id;
      const schemaPath = `governance/schema/${schemaId}.json`;
      
      try {
        let schemaContent;
        try {
            schemaContent = await SystemFiles.read(schemaPath);
        } catch (readError) {
             return { id: schemaId, version: schemaDef.version, verified: false, error: `File Read Error: Cannot locate or read file at ${schemaPath}` };
        }

        const calculatedContentHash = await CRoTCrypto.hash(schemaContent, schemaDef.hash_type);

        if (calculatedContentHash !== schemaDef.content_hash) {
          return { id: schemaId, version: schemaDef.version, verified: false, error: `Content hash mismatch. Expected: ${schemaDef.content_hash.substring(0, 8)}...` };
        }
        return { id: schemaId, version: schemaDef.version, verified: true };
      } catch (e) {
        return { id: schemaId, version: schemaDef.version, verified: false, error: `Schema Processing Error: ${e.message}` };
      }
    }));

    const failures = results.filter(r => !r.verified);
    if (failures.length > 0) {
      const failureList = failures.map(f => `${f.id} (v${f.version || 'N/A'}): ${f.error}`).join('\n  - ');
      throw new Error(`Foundational schema content verification failed for ${failures.length} schema(s):\n  - ${failureList}`);
    }
    return true;
  }

  /**
   * Step 3: Verify that required multi-signatures are logically present, based on policy.
   */
  async verifyAttestationsPresence() {
    const policy = await SSVRIntegrityCheck.loadIntegrityPolicy();
    const requiredSigners = policy.required_attestations || [];

    for (const requiredAttestation of requiredSigners) {
      const signerId = requiredAttestation.signer_id;
      const foundAttestation = this.ssvr.attestation_log.find(log => log.signer_id === signerId);

      if (!foundAttestation) {
        throw new Error(`Attestation Requirement Failure: Missing required signature from signer: ${signerId}.`);
      }
      
      if (requiredAttestation.minimum_version && foundAttestation.version && 
          foundAttestation.version < requiredAttestation.minimum_version) {
        // Logging warning for softer violation
        console.warn(`[SSVR Integrity] Attestation found for ${signerId}, but version ${foundAttestation.version} is below policy minimum ${requiredAttestation.minimum_version}.`);
      }
    }
    return true;
  }

  /**
   * Runs the complete sequence of integrity checks.
   */
  async runFullCheck() {
    // Ensure policy is loaded before any steps requiring configuration
    await SSVRIntegrityCheck.loadIntegrityPolicy();

    await this.verifySelfIntegrity();
    await this.verifySchemaContentHashes();
    await this.verifyAttestationsPresence();
    
    console.log(`[SSVR v${this.ssvr.version}] Integrity check passed successfully.`);
    return true;
  }
}

export default SSVRIntegrityCheck;