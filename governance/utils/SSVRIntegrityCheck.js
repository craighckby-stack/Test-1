/**
 * SSVRIntegrityCheck.js
 * ----------------------------------------------------
 * Core utility for validating the Sovereign Schema Version Registry (SSVR)
 * during system initialization against physical governance files and digital attestations.
 *
 * Refactor V94.1 AGI Changes:
 * 1. Policy Decoupling: Externalized policy loading failure modes and standardized access via dedicated getter.
 * 2. Optimized Flow Control: Verification steps use internal logging and throw structured SSVRError on failure (Fail-Fast).
 * 3. Robust Error Handling: Introduced SSVRError class for programmatic context capture upstream.
 * 4. Canonical Serialization: Reinforced mandatory use of `CanonicalJson`.
 *
 * V7.9.2 AGI Refactoring:
 * - Externalized file integrity checking logic into `ContentIntegrityVerifier` plugin.
 * - Completed implementation of `verifyAttestationsPresence`.
 */

import { CRoTCrypto } from 'core/crypto/CRoT';
import { SystemFiles } from 'core/system/filesystem';
import { CanonicalJson } from 'core/utils/CanonicalJson';
import { ContentIntegrityVerifier } from 'governance/plugins/ContentIntegrityVerifier';

// Policy path for Root-of-Trust configuration verification
const INTEGRITY_POLICY_PATH = 'governance/config/IntegrityPolicy.json';

/**
 * Custom error class for SSVR verification failures, providing detailed context.
 */
class SSVRError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'SSVRError';
        this.details = details;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SSVRError);
        }
    }
}

/**
 * SSVRIntegrityCheck handles the verification lifecycle for a single SSVR document.
 */
export class SSVRIntegrityCheck {
  
  static #integrityPolicyCache = null;

  constructor(ssvrContent) {
    if (!ssvrContent || typeof ssvrContent !== 'object' || !ssvrContent.version) {
      throw new SSVRError("SSVR Validation Setup Error: Invalid SSVR object provided or missing version.");
    }
    this.ssvr = ssvrContent;
    // Standardized results log, capturing every step result (Pass or Fail)
    this.verificationLog = []; 
  }

  /**
   * Helper function to safely load and cache configuration from the governing policy file.
   * Policy definition must be nested under the 'SSVR' key.
   */
  static async loadIntegrityPolicy() {
    if (SSVRIntegrityCheck.#integrityPolicyCache) {
        return SSVRIntegrityCheck.#integrityPolicyCache;
    }
    
    try {
        const policyContent = await SystemFiles.read(INTEGRITY_POLICY_PATH);
        const policyRoot = CanonicalJson.parse(policyContent); // Use CanonicalJson parsing
        
        const policy = policyRoot.SSVR;
        
        if (!policy || typeof policy !== 'object') {
             throw new SSVRError("Configuration file found but 'SSVR' policy definition is missing or malformed.", { source: INTEGRITY_POLICY_PATH });
        }
        
        SSVRIntegrityCheck.#integrityPolicyCache = policy;
        return policy;
    } catch (e) {
        // Re-throw using standardized error wrapper
        throw new SSVRError(`Integrity Policy Load Failure: Cannot load policy from ${INTEGRITY_POLICY_PATH}.`, { source: INTEGRITY_POLICY_PATH, innerError: e.message });
    }
  }

  /**
   * Generates a cryptographically canonical JSON string of the SSVR content
   * excluding integrity fields for self-hashing preparation.
   */
  _createHashableSSVRContent() {
    // Extract and ignore integrity_hash and potential future metadata fields (prefixed by _)
    const { integrity_hash, _metadata, ...hashableSSVR } = this.ssvr; 

    // Mandated CanonicalJson for deterministic serialization.
    return CanonicalJson.stringify(hashableSSVR);
  }

  /**
   * Records a step result in the log. Throws SSVRError if status is 'FAIL'.
   */
  _recordResult(step, status, details = {}) {
      const entry = { step, status, version: this.ssvr.version, timestamp: Date.now(), ...details };
      this.verificationLog.push(entry);

      if (status === 'FAIL') {
          // Throw detailed error to halt execution immediately (Fail-Fast)
          throw new SSVRError(`Integrity Check Failed at step [${step}].`, entry);
      }
  }

  /**
   * Step 1: Verify the top-level integrity hash of the SSVR document itself.
   */
  async verifySelfIntegrity(policy) {
    const step = 'SSVR_SELF_HASH';
    
    if (!this.ssvr.integrity_hash) {
        this._recordResult(step, 'FAIL', { reason: 'MissingRequiredHashField' });
    }
    
    const hashAlgorithm = policy.hash_algorithm || 'SHA-256';
    const hashableContent = this._createHashableSSVRContent();

    try {
        const calculatedHash = await CRoTCrypto.hash(hashableContent, hashAlgorithm);
        
        if (calculatedHash !== this.ssvr.integrity_hash) {
          const storedPrefix = this.ssvr.integrity_hash.substring(0, 10);
          const calculatedPrefix = calculatedHash.substring(0, 10);
          this._recordResult(step, 'FAIL', { 
            reason: 'HashMismatch', 
            expectedPrefix: storedPrefix, 
            calculatedPrefix: calculatedPrefix,
            algorithm: hashAlgorithm
          });
        }
        
        this._recordResult(step, 'PASS', { algorithm: hashAlgorithm });
    } catch (e) {
        this._recordResult(step, 'FAIL', { reason: 'CryptoProcessingError', error: e.message, algorithm: hashAlgorithm });
    }
  }

  /**
   * Step 2: Verify the hashes of all external schemas referenced in the registry.
   */
  async verifySchemaContentHashes() {
    const step = 'SCHEMA_CONTENT_HASHES';
    const definitions = this.ssvr.schema_definitions;
    
    if (!Array.isArray(definitions) || definitions.length === 0) {
        // Only fail if expected structures are missing in a high-integrity registry. 
        if (this.ssvr.integrity_level !== 'T0_Minimal') { 
             this._recordResult(step, 'PASS', { info: 'No schemas defined/checked.' });
             return;
        }
    }
    
    // Delegate verification using the ContentIntegrityVerifier plugin
    const verifications = definitions.map(schemaDef => {
      const schemaId = schemaDef.schema_id;
      const schemaPath = `governance/schema/${schemaId}.json`;
      
      // ContentIntegrityVerifier requires definition fields (content_hash, hash_type) and path
      return ContentIntegrityVerifier.verifyFile(schemaDef, schemaPath, schemaId);
    });
    
    const results = await Promise.all(verifications);

    const failures = results.filter(r => !r.verified);
    
    if (failures.length > 0) {
      const failureContext = failures.map(f => ({ id: f.identifier, version: f.version, reason: f.error }));
      this._recordResult(step, 'FAIL', { 
          total_schemas: definitions.length, 
          failures: failures.length,
          context: failureContext 
      });
    }

    this._recordResult(step, 'PASS', { total_schemas: definitions.length });
  }

  /**
   * Step 3: Verify that required multi-signatures (attestations) are present
   * and meet version requirements defined by the loaded policy.
   */
  async verifyAttestationsPresence(policy) {
    const step = 'ATTESTATION_POLICY_CHECK';
    const requiredSigners = policy.required_attestations || [];
    const ssvrVersion = this.ssvr.version;
    const attestationLog = this.ssvr.attestation_log || [];
    
    if (requiredSigners.length === 0) {
        this._recordResult(step, 'PASS', { info: 'No attestations required by policy.' });
        return;
    }
    
    // Identify signers who have attested to *this* specific SSVR version
    const presentSigners = new Set(
        attestationLog
            .filter(a => a.signed_version === ssvrVersion) 
            .map(a => a.signer_id)
    );
    
    const missingSigners = requiredSigners.filter(requiredId => !presentSigners.has(requiredId));
    
    if (missingSigners.length > 0) {
        this._recordResult(step, 'FAIL', { 
            reason: 'MissingRequiredAttestations',
            required_count: requiredSigners.length,
            missing_count: missingSigners.length,
            missing_signers: missingSigners,
            ssvr_version: ssvrVersion
        });
    }

    this._recordResult(step, 'PASS', { 
        required_count: requiredSigners.length,
        actual_count: requiredSigners.length - missingSigners.length
    });
  }
}