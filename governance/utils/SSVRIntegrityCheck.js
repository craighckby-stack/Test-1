/**
 * SSVRIntegrityCheck.js
 * ----------------------------------------------------
 * Core utility for validating the Sovereign Schema Version Registry (SSVR)
 * during system initialization against physical governance files and digital attestations.
 *
 * Refactor V94.1 Sovereign AGI Changes:
 * 1. Policy Encapsulation: Explicitly use modern Object spread/destructuring for cloning and key deletion.
 * 2. Optimized Flow Control: Policies are now loaded and passed down explicitly. Consolidated error reporting structure.
 * 3. Canonical Serialization: Reinforced mandatory use of `CanonicalJson` for all hash inputs.
 */

import { CRoTCrypto } from 'core/crypto/CRoT';
import { SystemFiles } from 'core/system/filesystem';
import { CanonicalJson } from 'core/utils/CanonicalJson';

// Policy path for Root-of-Trust configuration verification
const INTEGRITY_POLICY_PATH = 'governance/config/IntegrityPolicy.json';

/**
 * SSVRIntegrityCheck handles the verification lifecycle for a single SSVR document.
 */
export class SSVRIntegrityCheck {
  
  static _integrityPolicyCache = null;

  constructor(ssvrContent) {
    if (!ssvrContent || typeof ssvrContent !== 'object' || !ssvrContent.version) {
      throw new Error("SSVR Validation Setup Error: Invalid SSVR object provided or missing version.");
    }
    this.ssvr = ssvrContent;
    this.verificationResults = [];
  }

  /**
   * Helper function to safely load and cache configuration from the governing policy file.
   * Policy definition must be nested under the 'SSVR' key.
   */
  static async loadIntegrityPolicy() {
    if (SSVRIntegrityCheck._integrityPolicyCache) {
        return SSVRIntegrityCheck._integrityPolicyCache;
    }
    
    try {
        const policyContent = await SystemFiles.read(INTEGRITY_POLICY_PATH);
        const parsedPolicy = JSON.parse(policyContent).SSVR;
        
        if (!parsedPolicy) {
             throw new Error("Configuration file found but 'SSVR' policy definition is missing within it.");
        }
        SSVRIntegrityCheck._integrityPolicyCache = parsedPolicy;
        return parsedPolicy;
    } catch (e) {
        // Re-throw with high-context failure detail
        throw new Error(`Integrity Policy Load Failure for SSVR check: Cannot load policy from ${INTEGRITY_POLICY_PATH}. Details: ${e.message}`);
    }
  }

  /**
   * Generates a cryptographically canonical JSON string of the SSVR content
   * excluding the integrity_hash field for self-hashing preparation.
   * Utilizes Object destructuring for efficient property removal.
   */
  _createHashableSSVRContent() {
    // Extract and ignore integrity_hash; the remainder is hashableSSVR
    const { integrity_hash, ...hashableSSVR } = this.ssvr; 

    // Mandated CanonicalJson for deterministic serialization.
    return CanonicalJson.stringify(hashableSSVR);
  }

  /**
   * Step 1: Verify the top-level integrity hash of the SSVR document itself.
   */
  async verifySelfIntegrity(policy) {
    const step = 'SSVR_SELF_HASH';
    const hashableContent = this._createHashableSSVRContent();
    const hashAlgorithm = policy.hash_algorithm || 'SHA-256';
    
    if (!this.ssvr.integrity_hash) {
        throw new Error(`[${step}] Integrity Failure: 'integrity_hash' field is missing from SSVR document v${this.ssvr.version}.`);
    }

    try {
        const calculatedHash = await CRoTCrypto.hash(hashableContent, hashAlgorithm);
        
        if (calculatedHash !== this.ssvr.integrity_hash) {
          const storedPrefix = this.ssvr.integrity_hash.substring(0, 10);
          const calculatedPrefix = calculatedHash.substring(0, 10);
          throw new Error(`Calculated hash (${calculatedPrefix}...) does not match stored hash (${storedPrefix}...).`);
        }
        this.verificationResults.push({ step, status: 'PASS', algorithm: hashAlgorithm });
    } catch (e) {
        throw new Error(`[${step}] Self-Integrity Check Failed (v${this.ssvr.version}). Details: ${e.message}`);
    }
  }

  /**
   * Step 2: Verify the hashes of all external schemas referenced in the registry.
   */
  async verifySchemaContentHashes() {
    const step = 'SCHEMA_CONTENT_HASHES';
    if (!Array.isArray(this.ssvr.schema_definitions)) {
        throw new Error(`[${step}] Structure Error: 'schema_definitions' array is missing or malformed in v${this.ssvr.version}.`);
    }
    
    const results = await Promise.all(this.ssvr.schema_definitions.map(async (schemaDef, index) => {
      const schemaId = schemaDef.schema_id;
      const schemaPath = `governance/schema/${schemaId}.json`;
      
      if (!schemaDef.content_hash || !schemaDef.hash_type) {
           return { id: schemaId, verified: false, error: `Missing required definition fields (content_hash/hash_type).` };
      }

      try {
        let schemaContent;
        try {
            schemaContent = await SystemFiles.read(schemaPath);
        } catch (readError) {
             return { id: schemaId, version: schemaDef.version, verified: false, error: `File Read Error: Cannot locate or read file at ${schemaPath}` };
        }

        // Note: SSVR content verification often requires hashing the raw file buffer, not the parsed JSON object.
        const calculatedContentHash = await CRoTCrypto.hash(schemaContent, schemaDef.hash_type);

        if (calculatedContentHash !== schemaDef.content_hash) {
          const expectedPrefix = schemaDef.content_hash.substring(0, 8);
          return { id: schemaId, version: schemaDef.version, verified: false, error: `Content hash mismatch. Expected prefix: ${expectedPrefix}...` };
        }
        return { id: schemaId, version: schemaDef.version, verified: true };
      } catch (e) {
        return { id: schemaId, version: schemaDef.version, verified: false, error: `Unexpected Schema Processing Error: ${e.message}` };
      }
    }));

    const failures = results.filter(r => !r.verified);
    if (failures.length > 0) {
      const failureList = failures.map(f => `${f.id} (v${f.version || 'N/A'}): ${f.error}`).join('\n  - ');
      throw new Error(`[${step}] Foundational Schema Content Integrity Failed (${failures.length} total errors):\n  - ${failureList}`);
    }
    this.verificationResults.push({ step, status: 'PASS', schemas: this.ssvr.schema_definitions.length });
  }

  /**
   * Step 3: Verify that required multi-signatures (attestations) are present
   * and meet version requirements defined by the loaded policy.
   */
  async verifyAttestationsPresence(policy) {
    const step = 'ATTESTATION_POLICY_CHECK';
    const requiredSigners = policy.required_attestations || [];
    
    if (!Array.isArray(this.ssvr.attestation_log) && requiredSigners.length > 0) {
        throw new Error(`[${step}] Attestation Log Structure Error: Log is missing, but ${requiredSigners.length} required signatures mandated by policy.`);
    }

    for (const requiredAttestation of requiredSigners) {
      const signerId = requiredAttestation.signer_id;
      const foundAttestation = (this.ssvr.attestation_log || []).find(log => log.signer_id === signerId);

      if (!foundAttestation) {
        throw new Error(`[${step}] Requirement Failure: Missing required signature from signer: ${signerId}.`);
      }
      
      // Enforce strict version matching
      if (requiredAttestation.strict_version) {
         if (!foundAttestation.version || String(foundAttestation.version) !== String(requiredAttestation.strict_version)) {
             throw new Error(`[${step}] Requirement Failure: Signer ${signerId} provided v${foundAttestation.version || 'N/A'}, but policy strictly requires v${requiredAttestation.strict_version}.`);
         }
      }
      
      // Enforce minimum version (logging warning if soft failure)
      if (requiredAttestation.minimum_version) {
          const required = parseFloat(requiredAttestation.minimum_version);
          const actual = parseFloat(foundAttestation.version);
          if (isNaN(actual) || actual < required) {
             // Note: In strict V94.1 governance, this should fail initialization if policy mandates minimums, not just warn.
             throw new Error(`[${step}] Requirement Failure: Attestation for ${signerId} (v${foundAttestation.version}) is below policy minimum v${requiredAttestation.minimum_version}.`);
          }
      }
    }
    this.verificationResults.push({ step, status: 'PASS', required: requiredSigners.length });
  }

  /**
   * Runs the complete sequence of integrity checks.
   */
  async runFullCheck() {
    const startTime = process.hrtime.bigint();
    
    // Load policy first; this is critical state.
    const policy = await SSVRIntegrityCheck.loadIntegrityPolicy();

    // Sequence of verification steps (Fail-Fast design pattern)
    await this.verifySelfIntegrity(policy);
    await this.verifySchemaContentHashes();
    await this.verifyAttestationsPresence(policy);
    
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;
    
    console.log(`[SSVR v${this.ssvr.version}] Foundational Integrity Check Passed in ${durationMs.toFixed(3)}ms. Audit Log:`, this.verificationResults);
    return true;
  }
}

// We export the class directly instead of using 'default' to align with modern module conventions and ease future mock injection.
export { SSVRIntegrityCheck as default };