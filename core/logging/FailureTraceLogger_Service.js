/**
 * Sovereign AGI v94.1 Failure Trace Logger Service (FTLS)
 * Handles cryptographic certification and immutable storage connection for FTLs.
 * Requires initialized Signer, Storage, and Telemetry providers for reliable operation.
 */
class FailureTraceLogger_Service {
  /**
   * Initializes the FTL Service with explicit dependencies.
   * @param {Object} dependencies
   * @param {Object} dependencies.config - FTL configuration settings.
   * @param {Object} dependencies.signer - Cryptographic signing implementation (must have .sign(data)).
   * @param {Object} dependencies.storage - Immutable append-only storage implementation (must have async .append(record)).
   * @param {Object} dependencies.telemetryService - Centralized operational logging and auditing service.
   * @param {Object} [dependencies.validator] - Optional SchemaValidator utility (preferred for validation).
   */
  constructor({ config, signer, storage, telemetryService, validator }) {
    if (!config || !signer || !storage || !telemetryService) {
      throw new Error("FTL Service Initialization Failed: Missing required core dependencies (config, signer, storage, telemetryService).");
    }
    this.config = config.failure_trace_log_config || {};
    this.signer = signer;
    this.storage = storage;
    this.telemetryService = telemetryService;
    this.validator = validator; // Schema validation utility
  }

  /**
   * Ensures the failure trace data adheres to the required schema.
   * Prioritizes the dedicated SchemaValidator_Util if provided.
   * @param {Object} data - The FTL payload.
   * @throws {Error} if validation fails.
   */
  validateSchema(data) {
    if (typeof data !== 'object' || data === null) {
        throw new Error("FTL Schema Validation Error (Type Check): Input data must be a non-null object.");
    }

    if (this.validator) {
        // High-Intelligence Path: Utilize centralized schema definition
        const validationResult = this.validator.validate('FailureTraceLog', data);
        if (!validationResult.isValid) {
             throw new Error(`FTL Schema Validation Failed (Utility): ${validationResult.errors.join('; ')}`);
        }
        return;
    }

    // Fallback/Legacy Path: Simple check for critical fields
    const required = this.config.schema_required_fields || ['timestamp', 'component', 'trace_id'];
    const missing = required.filter(field => data[field] === undefined || data[field] === null);

    if (missing.length > 0) {
        throw new Error(`FTL Schema Validation Failed (Fallback): Missing required fields: [${missing.join(', ')}]`);
    }
  }

  /**
   * Certifies the failure trace data cryptographically and commits it to immutable storage.
   * @param {Object} ftl_data - The raw failure trace payload.
   * @returns {Promise<string>} The storage confirmation ID or reference.
   */
  async certifyAndLog(ftl_data) {
    try {
        this.validateSchema(ftl_data); // Synchronous pre-flight validation

        const data_string = JSON.stringify(ftl_data);
        
        // Step 1: Cryptographic Assertion (Signing)
        const signed_record = this.signer.sign(data_string);
        
        // Step 2: Immutable Append Operation
        const storage_reference = await this.storage.append(signed_record);

        // Step 3: Audit Trail Logging (Asynchronously via Telemetry Service)
        this.telemetryService.logAudit({
            level: 'INFO',
            service: 'FTLS',
            operation: 'FTL_CERTIFIED',
            message: 'Failure Trace Log Certified and Committed.',
            trace_id: ftl_data.trace_id,
            record_ref: storage_reference
        });

        return storage_reference;

    } catch (error) {
        // Log the failure via Telemetry, then rethrow contextually.
        this.telemetryService.logError({
            service: 'FTLS',
            error_type: 'Critical_Logging_Path_Failure',
            details: error.message,
            input_context: ftl_data ? ftl_data.trace_id : 'N/A'
        });
        
        // Re-wrap and rethrow to maintain caller context integrity
        throw new Error(`FTL Certification or Storage Critical Failure: ${error.message}`);
    }
  }
}

module.exports = FailureTraceLogger_Service;