class ACVD_IntegrityValidator {
  
  /**
   * @param {object} acvdRecord - The ACVD object adhering to ACVD_schema.json
   * @param {object} systemContext - The system's contextual state used for context_hash verification.
   */
  async validate(acvdRecord, systemContext) {
    // 1. Validate structure against the JSON Schema (ACVD_schema.json).
    const schemaValidationResult = SchemaTool.validate(acvdRecord, this.schema);
    if (!schemaValidationResult.valid) {
      throw new Error(`Schema violation: ${schemaValidationResult.errors.join(', ')}`);
    }

    // 2. Cross-check Context Hash.
    const calculatedContextHash = HashService.calculateSHA256(systemContext);
    if (calculatedContextHash !== acvdRecord.context_hash) {
      throw new Error("Context hash mismatch. ACVD record integrity compromised or context incorrectly calculated.");
    }

    // 3. Verify Artifact Hashes against filesystem (post-change validation).
    for (const artifact of acvdRecord.artifact_changes) {
      if (artifact.operation !== 'DELETE' && artifact.hash_after) {
        const currentFileHash = await HashService.hashFile(artifact.path);
        if (currentFileHash !== artifact.hash_after) {
          throw new Error(`Post-change hash mismatch for file: ${artifact.path}.`);
        }
      }
    }
    
    return true; // Integrity passed
  }
}