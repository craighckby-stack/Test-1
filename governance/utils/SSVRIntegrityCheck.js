/**
 * SSVRIntegrityCheck.js
 * ----------------------------------------------------
 * Core utility for validating the Schema Version Registry (SSVR)
 * during system initialization against physical governance files and digital attestations.
 */

import { CRoTCrypto } from 'core/crypto/CRoT';
import { SystemFiles } from 'core/system/filesystem';

class SSVRIntegrityCheck {
  constructor(ssvrContent) {
    if (!ssvrContent || typeof ssvrContent !== 'object') {
      throw new Error("SSVR content must be provided for validation.");
    }
    this.ssvr = ssvrContent;
  }

  /**
   * Step 1: Verify the top-level integrity hash of the SSVR document itself.
   * This check must align with the S0 ANCHOR INIT process.
   */
  async verifySelfIntegrity(rawSSVRString) {
    // The raw string is needed because the 'integrity_hash' field must be excluded 
    // before hashing, but for illustrative purposes here, we use the provided hash utility.
    const calculatedHash = await CRoTCrypto.hash(rawSSVRString.replace(this.ssvr.integrity_hash, ''), 'SHA-256');
    
    if (calculatedHash !== this.ssvr.integrity_hash) {
      throw new Error(`SSVR Integrity Failure: Calculated file hash does not match stored integrity_hash.`);
    }
    return true;
  }

  /**
   * Step 2: Verify the hashes of all external schemas referenced in the registry
   * by recalculating their content hash upon runtime loading.
   */
  async verifySchemaContentHashes() {
    const results = await Promise.all(this.ssvr.schema_definitions.map(async (schemaDef) => {
      try {
        const schemaPath = `governance/schema/${schemaDef.schema_id}.json`;
        const schemaContent = await SystemFiles.read(schemaPath);
        const calculatedContentHash = await CRoTCrypto.hash(schemaContent, schemaDef.hash_type);

        if (calculatedContentHash !== schemaDef.content_hash) {
          return { id: schemaDef.schema_id, verified: false, error: "Content hash mismatch." };
        }
        return { id: schemaDef.schema_id, verified: true };
      } catch (e) {
        return { id: schemaDef.schema_id, verified: false, error: e.message };
      }
    }));

    const failures = results.filter(r => !r.verified);
    if (failures.length > 0) {
      const failureList = failures.map(f => `${f.id} (${f.version}): ${f.error}`).join('; ');
      throw new Error(`Foundational schema content verification failed for: ${failureList}`);
    }
    return true;
  }

  /**
   * Step 3: Verify that required multi-signatures are logically present.
   * (Full cryptographic verification against the CSTL is handled by the CRoT service layer).
   */
  verifyAttestationsPresence() {
    const requiredSigners = ["CRoT", "GAX"]; 

    for (const requiredSigner of requiredSigners) {
      const foundAttestation = this.ssvr.attestation_log.find(log => log.signer_id === requiredSigner);
      if (!foundAttestation) {
        throw new Error(`Missing required attestation from signer ${requiredSigner}.`);
      }
    }
    return true;
  }

  async runFullCheck(rawSSVRString) {
    await this.verifySelfIntegrity(rawSSVRString);
    await this.verifySchemaContentHashes();
    this.verifyAttestationsPresence();
    return true;
  }
}

export default SSVRIntegrityCheck;