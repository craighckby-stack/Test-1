import { SchemaValidator, HashService } from './utilities/services'; 

/**
 * ACVD_IntegrityValidator is responsible for ensuring that an Autonomous Code Versioning Document
 * (ACVD) is valid against its schema, consistent with the system's operational context, and
 * verifiable against the resulting filesystem state (post-change).
 */
class ACVD_IntegrityValidator {
  
  /**
   * @param {object} dependencies 
   * @param {SchemaValidator} dependencies.schemaValidator Instance of a robust schema validation utility.
   * @param {HashService} dependencies.hashService Instance of the hashing utility (must provide calculateSHA256 and hashFile).
   * @param {object} dependencies.acvdSchema The parsed ACVD JSON schema object definition.
   */
  constructor({ schemaValidator, hashService, acvdSchema }) {
    if (!schemaValidator || !hashService || !acvdSchema) {
      throw new Error("ACVD_IntegrityValidator: Missing required dependency injection (schemaValidator, hashService, acvdSchema).");
    }
    this.schemaValidator = schemaValidator;
    this.hashService = hashService;
    this.acvdSchema = acvdSchema;
  }

  /**
   * Creates a structured, composite error containing all validation failures.
   * This supports structured logging and meta-reasoning capabilities.
   * @param {Array<object>} errors - Array of structured error objects.
   * @param {string} summary - High-level error summary.
   * @returns {Error} Composite error object.
   */
  _createCompositeError(errors, summary) {
    const error = new Error(summary);
    error.name = "ACVDIntegrityError";
    error.details = errors;
    return error;
  }

  /**
   * Validates the ACVD object structure against the predefined schema.
   * @param {object} acvdRecord 
   * @returns {Array<object>} Array of structured error objects, or empty array if valid.
   */
  _validateStructure(acvdRecord) {
    const validationResult = this.schemaValidator.validate(acvdRecord, this.acvdSchema);
    if (!validationResult.valid) {
      return validationResult.errors.map(e => ({
        type: 'SCHEMA_VIOLATION',
        code: 'ACVD_STRUCT_ERROR',
        path: e.dataPath || 'Root',
        message: e.message
      }));
    }
    return [];
  }

  /**
   * Ensures the system context hash within the ACVD matches the hash calculated from the provided live context.
   * @param {object} acvdRecord 
   * @param {object} systemContext 
   * @returns {Array<object>} Array of structured error objects, or empty array if valid.
   */
  _validateContextHash(acvdRecord, systemContext) {
    // Note: HashService must ensure deterministic serialization of systemContext.
    const calculatedContextHash = this.hashService.calculateSHA256(systemContext);
    if (calculatedContextHash !== acvdRecord.context_hash) {
      return [{
        type: 'CONTEXT_INTEGRITY_FAIL',
        code: 'CONTEXT_HASH_MISMATCH',
        path: null,
        message: `Context hash mismatch. Calculated: ${calculatedContextHash}. Expected: ${acvdRecord.context_hash}.`
      }];
    }
    return [];
  }

  /**
   * Verifies the actual file hashes on the filesystem match the post-change hashes recorded in the ACVD.
   * Runs hash calculations concurrently for efficiency.
   * @param {Array<object>} artifactChanges 
   * @returns {Promise<Array<object>>} Promise resolving to an array of structured error objects.
   */
  async _validateArtifactHashes(artifactChanges) {
    const verificationTasks = artifactChanges
      .filter(artifact => artifact.operation !== 'DELETE' && artifact.hash_after)
      .map(async (artifact) => {
        try {
          const currentFileHash = await this.hashService.hashFile(artifact.path);
          if (currentFileHash !== artifact.hash_after) {
            return { 
                type: 'ARTIFACT_INTEGRITY_FAIL', 
                code: 'POST_CHANGE_HASH_MISMATCH',
                path: artifact.path, 
                message: `Hash mismatch. Filesystem: ${currentFileHash}. ACVD Record: ${artifact.hash_after}` 
            };
          }
          return null; // Success
        } catch (e) {
          // Failure to read file indicates a serious integrity issue post-change.
          return { 
            type: 'ARTIFACT_INTEGRITY_FAIL', 
            code: 'FILESYSTEM_ACCESS_ERROR',
            path: artifact.path, 
            message: `Filesystem access failure or artifact missing post-change: ${e.message}` 
          }; 
        }
      });

    const results = await Promise.all(verificationTasks);
    // Filter out successful validations (nulls)
    return results.filter(r => r !== null);
  }


  /**
   * Executes the full integrity validation process.
   * If validation fails, throws a structured ACVDIntegrityError containing all failure details.
   * @param {object} acvdRecord - The ACVD object.
   * @param {object} systemContext - The system's contextual state for hash verification.
   * @returns {Promise<boolean>} True if all checks pass.
   * @throws {ACVDIntegrityError} Throws if any check fails.
   */
  async validate(acvdRecord, systemContext) {
    let integrityErrors = [];

    // 1. Synchronous Schema Validation
    integrityErrors.push(...this._validateStructure(acvdRecord));

    // Halt immediately if schema is invalid, as further checks rely on valid structure
    if (integrityErrors.length > 0) {
      throw this._createCompositeError(integrityErrors, "Critical ACVD structural failure detected.");
    }

    // 2. Synchronous Context Hash Verification
    integrityErrors.push(...this._validateContextHash(acvdRecord, systemContext));

    // 3. Asynchronous, concurrent Artifact Hash Verification against the filesystem
    integrityErrors.push(...await this._validateArtifactHashes(acvdRecord.artifact_changes));
    
    if (integrityErrors.length > 0) {
      throw this._createCompositeError(integrityErrors, `ACVD failed integrity check with ${integrityErrors.length} validation errors.`);
    }

    return true; // Integrity passed
  }
}

export default ACVD_IntegrityValidator;