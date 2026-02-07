/**
 * Sovereign AGI v94.1 Failure Trace Logger Service (FTLS)
 * Handles cryptographic certification and immutable storage connection for FTLs.
 * Utilizes canonical JSON serialization for cryptographic integrity, prioritizing it heavily.
 * 
 * Requirements: Signer, Storage, Telemetry, and JsonCanonicalizer dependencies are strongly required.
 */

const FTL_SCHEMA_ID = 'FailureTraceLog_v1';

/**
 * Configuration constants for strict checking.
 * If a central SchemaRegistry provided these, they would be external.
 */
const CRITICAL_REQUIRED_FIELDS = ['timestamp', 'component', 'trace_id']; 

class FailureTraceLogger_Service {
  /**
   * Initializes the FTL Service with explicit dependencies.
   * @param {Object} dependencies
   * @param {Object} dependencies.config - FTL configuration settings.
   * @param {Object} dependencies.signer - Cryptographic signing implementation (must have .sign(data)).
   * @param {Object} dependencies.storage - Immutable append-only storage implementation (must have async .append(record)).
   * @param {Object} dependencies.telemetryService - Centralized operational logging and auditing service.
   * @param {Object} dependencies.jsonCanonicalizer - Utility for canonical JSON serialization (CRITICAL DEPENDENCY).
   * @param {Object} [dependencies.validator] - Optional SchemaValidator utility.
   */
  constructor({ config, signer, storage, telemetryService, jsonCanonicalizer, validator }) {
    const requiredDeps = { signer, storage, telemetryService, config, jsonCanonicalizer };
    
    for (const [key, value] of Object.entries(requiredDeps)) {
      if (!value) {
        throw new Error(`FTL_INIT_CRITICAL: Missing required core dependency: ${key}.`);
      }
    }
    
    this.config = config.failure_trace_log_config || {};
    this.signer = signer;
    this.storage = storage;
    this.telemetryService = telemetryService;
    this.jsonCanonicalizer = jsonCanonicalizer; 
    this.validator = validator;
    
    // Check if canonicalizer has required method
    if (typeof this.jsonCanonicalizer.canonicalize !== 'function') {
        throw new Error("FTL_INIT_CRITICAL: JsonCanonicalizer must expose a 'canonicalize' method.");
    }
  }

  /**
   * Internal method to ensure the failure trace data adheres to the required schema.
   * This replaces the public validateSchema and makes validation an internal contract.
   * @param {Object} data - The FTL payload.
   * @throws {Error} if validation fails.
   */
  _validatePayload(data) {
    if (typeof data !== 'object' || data === null) {
        throw new Error("FTL_VALIDATION_ERROR: Input data must be a non-null object.");
    }

    if (this.validator) {
        // High-Intelligence Path: Utilize centralized schema definition
        const validationResult = this.validator.validate(FTL_SCHEMA_ID, data);
        if (!validationResult.isValid) {
             throw new Error(`FTL_SCHEMA_ERROR: Utility Validation Failed: ${validationResult.errors.join('; ')}`);
        }
        return;
    }

    // Fallback Path (Config driven, less reliable)
    const requiredFields = this.config.schema_required_fields || CRITICAL_REQUIRED_FIELDS;
    const missing = requiredFields.filter(field => data[field] === undefined || data[field] === null);

    if (missing.length > 0) {
        throw new Error(`FTL_SCHEMA_FALLBACK_ERROR: Missing required fields: [${missing.join(', ')}]`);
    }
  }

  /**
   * Generates a canonical string representation of the data for signing.
   * CRITICAL: Uses the mandatory JsonCanonicalizer utility.
   * @param {Object} data - The data object to serialize.
   * @returns {string} The canonicalized string representation.
   */
  _getCanonicalDataString(data) {
      // Dependency is guaranteed by constructor check.
      return this.jsonCanonicalizer.canonicalize(data);
  }

  /**
   * Constructs the final, certified record object including signature and metadata.
   * @param {Object} ftl_data - The validated raw failure trace payload.
   * @param {string} canonical_data_string - The canonical string representation.
   * @returns {Object} The complete certified record.
   */
  _buildCertifiedRecord(ftl_data, canonical_data_string) {
      const signature = this.signer.sign(canonical_data_string);

      return {
          payload: ftl_data, 
          signature_metadata: {
              schema_id: FTL_SCHEMA_ID,
              algorithm: this.signer.algorithm || 'UNKNOWN',
              key_id: (this.signer.getPublicKeyId && this.signer.getPublicKeyId()) || 'FTL_DEFAULT_KEY',
              canonical_source_hash: (this.jsonCanonicalizer.hash && this.jsonCanonicalizer.hash(canonical_data_string)) || undefined,
              signed_data: signature,
              timestamp_ftls: Date.now()
          }
      };
  }

  /**
   * Certifies the failure trace data cryptographically and commits it to immutable storage.
   * @param {Object} ftl_data - The raw failure trace payload.
   * @returns {Promise<string>} The storage confirmation ID or reference.
   */
  async certifyAndLog(ftl_data) {
    let storage_reference = 'N/A';
    
    try {
        // 1. Validation Check
        this._validatePayload(ftl_data); 

        // 2. Canonicalization for Cryptographic Integrity
        const canonical_data_string = this._getCanonicalDataString(ftl_data);
        
        // 3. Cryptographic Assertion and Record Construction
        const certified_record = this._buildCertifiedRecord(ftl_data, canonical_data_string);
        
        // 4. Immutable Append Operation
        storage_reference = await this.storage.append(certified_record);

        // 5. Audit Trail Logging 
        this.telemetryService.logAudit({
            level: 'SUCCESS',
            service: 'FTLS',
            operation: 'FTL_CERTIFIED',
            message: 'Failure Trace Log Certified and Committed.',
            trace_id: ftl_data.trace_id,
            record_ref: storage_reference
        });

        return storage_reference;

    } catch (error) {
        const error_id = `CRIT_LOG_FAIL_${Date.now()}`;
        
        // Log the failure via Telemetry, capturing stack trace for diagnosis.
        this.telemetryService.logError({
            service: 'FTLS',
            error_type: 'FTL_Certification_Path_Failure',
            error_id: error_id,
            details: error.message,
            stack: error.stack, // Capture stack trace if available
            input_context: ftl_data ? ftl_data.trace_id : 'NO_TRACE_ID',
            storage_ref: storage_reference
        });
        
        // Re-wrap and rethrow to signal catastrophic logging path failure
        throw new Error(`[${error_id}] FTL Critical Failure: Logging Path Disabled. Original error: ${error.message}`);
    }
  }
}

module.exports = FailureTraceLogger_Service;
