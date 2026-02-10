import { SchemaValidator, HashService } from './utilities/services'; 

/**
 * ACVD_IntegrityValidator is responsible for ensuring that an Autonomous Code Versioning Document
 * (ACVD) is valid against its schema, consistent with the system's operational context, and
 * verifiable against the resulting filesystem state (post-change).
 * 
 * Note: This validator is designed for POST-COMMIT validation, verifying the resulting state 
 * matches the ACVD's recorded 'hash_after' values.
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
   * @private
   * @param {Array<object>} errors - Array of structured error objects (e.g., from validation steps).
   * @param {string} summary - High-level error summary.
   * @returns {Error} Composite error object with structured details.
   */
  _createCompositeError(errors, summary) {
    const error = new Error(summary);
    error.name = "ACVDIntegrityError";
    error.details = errors;
    return error;
  }

  /**
   * Validates the ACVD object structure against the predefined schema.
   * @private
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
        message: e.message,
        detail: `Validation failed at path: ${e.dataPath}`
      }));
    }
    return [];
  }

  /**
   * Ensures the system context hash within the ACVD matches the hash calculated from the provided live context.
   * @private
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
        message: 'System context hash recorded in ACVD does not match live system context.',
        detail: `Calculated: ${calculatedContextHash}. Expected ACVD: ${acvdRecord.context_hash}.`
      }];
    }
    return [];
  }

  /**
   * Verifies the actual file hashes on the filesystem match the post-change (hash_after) hashes 
   * recorded in the ACVD for all created or modified artifacts.
   * Runs hash calculations concurrently for efficiency.
   * @private
   * @param {Array<object>} artifactChanges 
   * @returns {Promise<Array<object>>} Promise resolving to an array of structured error objects.
   */
  async _validatePostChangeHashes(artifactChanges) {
    // Only check artifacts that should exist and have a recorded hash_after value.
    const targets = artifactChanges.filter(artifact => 
      (artifact.operation === 'CREATE' || artifact.operation === 'UPDATE') && artifact.hash_after
    );
    
    const verificationTasks = targets.map(async (artifact) => {
        const expectedHash = artifact.hash_after;
        
        try {
          const currentFileHash = await this.hashService.hashFile(artifact.path);
          
          if (currentFileHash !== expectedHash) {
            return { 
                type: 'ARTIFACT_INTEGRITY_FAIL', 
                code: 'POST_CHANGE_HASH_MISMATCH',
                path: artifact.path,
                operation: artifact.operation,
                message: `Post-change artifact hash mismatch for operation: ${artifact.operation}.`,
                detail: `Filesystem hash: ${currentFileHash}. ACVD Expected hash: ${expectedHash}` 
            };
          }
          return null; // Success
        } catch (e) {
          // Failure to read file indicates a serious integrity issue post-change (e.g., file missing or permission error).
          // This should trigger an immediate rollback/alert.
          return { 
            type: 'ARTIFACT_INTEGRITY_FAIL', 
            code: 'FILESYSTEM_ACCESS_ERROR',
            path: artifact.path, 
            operation: artifact.operation,
            message: `Filesystem access failure or artifact state inconsistent post-change.`,
            detail: `Error: ${e.message}`
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
   * @param {object} acvdRecord - The ACVD object containing proposed changes and metadata.
   * @param {object} systemContext - The system's contextual state for overall hash verification.
   * @returns {Promise<boolean>} True if all checks pass.
   * @throws {ACVDIntegrityError} Throws if any check fails.
   */
  async validate(acvdRecord, systemContext) {
    let integrityErrors = [];

    // 1. Synchronous Schema Validation
    integrityErrors.push(...this._validateStructure(acvdRecord));

    // Halt immediately if schema is invalid, as further checks rely on valid structure
    if (integrityErrors.length > 0) {
      throw this._createCompositeError(integrityErrors, "Critical ACVD structural failure detected. Cannot proceed with content validation.");
    }

    // 2. Synchronous Context Hash Verification
    integrityErrors.push(...this._validateContextHash(acvdRecord, systemContext));

    // 3. Asynchronous, concurrent Artifact Hash Verification against the filesystem
    integrityErrors.push(...await this._validatePostChangeHashes(acvdRecord.artifact_changes));
    
    if (integrityErrors.length > 0) {
      // Use a custom summary for easy parsing by the kernel's monitoring systems
      const summary = `ACVD failed integrity check. Errors detected: ${integrityErrors.length}. First Code: ${integrityErrors[0].code}.`;
      throw this._createCompositeError(integrityErrors, summary);
    }

    return true; // Integrity passed
  }
}