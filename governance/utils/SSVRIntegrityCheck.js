/**
 * SSVRIntegrityCheck.js
 * ----------------------------------------------------
 * Core utility for validating the Schema Version Registry (SSVR)
 * during system initialization against physical governance files and digital attestations.
 *
 * Refactor V94.1 Sovereign AGI Changes:
 * 1. Explicit Canonicalization: Replaced fallible hash input serialization with a dedicated,
 *    cryptographically safe CanonicalJson utility.
 * 2. Optimized Policy Flow: Policy configuration is loaded once at runtime and explicitly
 *    passed to dependent verification steps, improving dependency clarity.
 * 3. Enhanced Attestation Rules: Added support for 'strict_version' requirements in attestation policy checks.
 */

import { CRoTCrypto } from 'core/crypto/CRoT';
import { SystemFiles } from 'core/system/filesystem';
import { CanonicalJson } from 'core/utils/CanonicalJson'; 

const INTEGRITY_POLICY_PATH = 'governance/config/IntegrityPolicy.json';
let _integrityPolicyCache = null;

class SSVRIntegrityCheck {
  constructor(ssvrContent) {
    if (!ssvrContent || typeof ssvrContent !== 'object' || !ssvrContent.version) {
      throw new Error("SSVR Validation Setup Error: Invalid SSVR object provided. Missing version or structure.");
    }
    this.ssvr = ssvrContent;
  }

  /**
   * Helper function to safely load and cache configuration from the governing policy file.
   */
  static async loadIntegrityPolicy() {
    if (!_integrityPolicyCache) {
        try {
            const policyContent = await SystemFiles.read(INTEGRITY_POLICY_PATH);
            // Assumes SSVR policy configuration is nested under the 'SSVR' key.
            const parsedPolicy = JSON.parse(policyContent).SSVR;
            if (!parsedPolicy) {
                 throw new Error("Configuration file found but 'SSVR' policy definition is missing.");
            }
            _integrityPolicyCache = parsedPolicy;
        } catch (e) {
            throw new Error(`Integrity Policy Load Failure: Could not load SSVR policy from ${INTEGRITY_POLICY_PATH}. Details: ${e.message}`);
        }
    }
    return _integrityPolicyCache;
  }

  /**
   * Generates a cryptographically canonical JSON string of the SSVR content
   * excluding the integrity_hash field to prepare for self-hashing.
   */
  _createHashableSSVRContent() {
    const tempSSVR = JSON.parse(JSON.stringify(this.ssvr)); // Deep clone
    delete tempSSVR.integrity_hash;

    // Utilize the mandated standard CanonicalJson utility for deterministic serialization.
    return CanonicalJson.stringify(tempSSVR);
  }

  /**
   * Step 1: Verify the top-level integrity hash of the SSVR document itself.
   */
  async verifySelfIntegrity(policy) {
    const hashableContent = this._createHashableSSVRContent();
    const hashAlgorithm = policy.hash_algorithm || 'SHA-256';

    if (!this.ssvr.integrity_hash) {
        throw new Error(`SSVR Integrity Failure: 'integrity_hash' field is missing from SSVR document v${this.ssvr.version}.`);
    }

    const calculatedHash = await CRoTCrypto.hash(hashableContent, hashAlgorithm);
    
    if (calculatedHash !== this.ssvr.integrity_hash) {
      const storedPrefix = this.ssvr.integrity_hash.substring(0, 10);
      const calculatedPrefix = calculatedHash.substring(0, 10);
      throw new Error(`SSVR Self-Integrity Check Failed (v${this.ssvr.version}): Calculated hash (${calculatedPrefix}...) does not match stored hash (${storedPrefix}...).`);
    }
    return true;
  }

  /**
   * Step 2: Verify the hashes of all external schemas referenced in the registry
   * by recalculating their content hash upon runtime loading.
   */
  async verifySchemaContentHashes() {
    if (!Array.isArray(this.ssvr.schema_definitions)) {
        throw new Error(`SSVR Structure Error: 'schema_definitions' array is missing or malformed in v${this.ssvr.version}.`);
    }
    
    const verificationPromises = this.ssvr.schema_definitions.map(async (schemaDef, index) => {
      const schemaId = schemaDef.schema_id;
      const schemaPath = `governance/schema/${schemaId}.json`;
      
      if (!schemaDef.content_hash || !schemaDef.hash_type) {
           return { id: schemaId, verified: false, error: `Schema definition ${index} missing required fields (content_hash/hash_type).` };
      }

      try {
        let schemaContent;
        try {
            schemaContent = await SystemFiles.read(schemaPath);
        } catch (readError) {
             return { id: schemaId, version: schemaDef.version, verified: false, error: `File Read Error: Cannot locate or read file at ${schemaPath}` };
        }

        const calculatedContentHash = await CRoTCrypto.hash(schemaContent, schemaDef.hash_type);

        if (calculatedContentHash !== schemaDef.content_hash) {
          const expectedPrefix = schemaDef.content_hash.substring(0, 8);
          return { id: schemaId, version: schemaDef.version, verified: false, error: `Content hash mismatch. Expected: ${expectedPrefix}...` };
        }
        return { id: schemaId, version: schemaDef.version, verified: true };
      } catch (e) {
        return { id: schemaId, version: schemaDef.version, verified: false, error: `Schema Processing Error (${schemaId}): ${e.message}` };
      }
    });

    const results = await Promise.all(verificationPromises);
    
    const failures = results.filter(r => !r.verified);
    if (failures.length > 0) {
      const failureList = failures.map(f => `${f.id} (v${f.version || 'N/A'}): ${f.error}`).join('\n  - ');
      throw new Error(`Foundational Schema Content Integrity Failed (${failures.length} errors):\n  - ${failureList}`);
    }
    return true;
  }

  /**
   * Step 3: Verify that required multi-signatures (attestations) are present
   * and meet version requirements defined by the loaded policy.
   */
  async verifyAttestationsPresence(policy) {
    if (!Array.isArray(this.ssvr.attestation_log)) {
        if (policy.required_attestations && policy.required_attestations.length > 0) {
            throw new Error("Attestation Log Structure Error: Attestation log is missing, but required signatures are mandated by policy.");
        }
        return true; 
    }
    
    const requiredSigners = policy.required_attestations || [];

    for (const requiredAttestation of requiredSigners) {
      const signerId = requiredAttestation.signer_id;
      const foundAttestation = this.ssvr.attestation_log.find(log => log.signer_id === signerId);

      if (!foundAttestation) {
        throw new Error(`Attestation Requirement Failure: Missing required signature from signer: ${signerId}.`);
      }
      
      // Enforce strict version matching if mandated by policy
      if (requiredAttestation.strict_version && foundAttestation.version && 
          String(foundAttestation.version) !== String(requiredAttestation.strict_version)) {
         throw new Error(`Attestation Requirement Failure: Signer ${signerId} provided version ${foundAttestation.version}, but policy strictly requires ${requiredAttestation.strict_version}.`);
      }
      
      // Enforce minimum version
      if (requiredAttestation.minimum_version && foundAttestation.version && 
          foundAttestation.version < requiredAttestation.minimum_version) {
        // Note: This is maintained as a soft failure/warning unless a strict requirement is set.
        console.warn(`[SSVR Integrity Soft Warning] Attestation for ${signerId} (v${foundAttestation.version}) is below policy minimum v${requiredAttestation.minimum_version}.`);
      }
    }
    return true;
  }

  /**
   * Runs the complete sequence of integrity checks.
   */
  async runFullCheck() {
    const policy = await SSVRIntegrityCheck.loadIntegrityPolicy();

    await this.verifySelfIntegrity(policy);
    await this.verifySchemaContentHashes();
    await this.verifyAttestationsPresence(policy);
    
    console.log(`[SSVR v${this.ssvr.version}] Foundational Integrity Check Passed.`);
    return true;
  }
}

export default SSVRIntegrityCheck;
