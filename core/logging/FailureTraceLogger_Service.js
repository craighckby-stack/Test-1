/**
 * Sovereign AGI v94.1 Failure Trace Logger Service (FTLS)
 * Handles cryptographic certification and immutable storage connection for FTLs.
 * Requires initialized Signer and Storage providers for reliable operation.
 */
class FailureTraceLogger_Service {
  /**
   * Initializes the FTL Service with explicit dependencies.
   * @param {Object} dependencies
   * @param {Object} dependencies.config - FTL configuration settings.
   * @param {Object} dependencies.signer - Cryptographic signing implementation (must have .sign(data)).
   * @param {Object} dependencies.storage - Immutable append-only storage implementation (must have async .append(record)).
   * @param {Object} [dependencies.validator] - Optional SchemaValidator utility.
   */
  constructor({ config, signer, storage, validator }) {
    if (!config || !signer || !storage) {
      throw new Error("FTL Service Initialization Failed: Missing required dependencies (config, signer, storage).");
    }
    this.config = config.failure_trace_log_config || {};
    this.signer = signer;
    this.storage = storage;
    this.validator = validator; // Use injected utility if available
  }

  /**
   * Ensures the failure trace data adheres to the minimum required schema.
   * Prefers the dedicated SchemaValidator_Util if provided.
   * @param {Object} data - The FTL payload.
   * @throws {Error} if validation fails.
   */
  validateSchema(data) {
    if (typeof data !== 'object' || data === null) {
        throw new Error("FTL Schema Validation Failed: Input data must be a non-null object.");
    }

    if (this.validator) {
        const validationResult = this.validator.validate('FailureTraceLog', data);
        if (!validationResult.isValid) {
             throw new Error(`FTL Schema Validation Failed via Utility: ${validationResult.errors.join('; ')}`);
        }
        return true;
    }

    // Fallback: Legacy config array validation
    const required = this.config.schema_required_fields || ['timestamp', 'component', 'trace_id'];
    const missing = required.filter(field => typeof data[field] === 'undefined' || data[field] === null);

    if (missing.length > 0) {
        throw new Error(`FTL Schema Validation Failed: Missing required fields: [${missing.join(', ')}]`);
    }
    return true;
  }

  /**
   * Certifies the failure trace data cryptographically and commits it to immutable storage.
   * @param {Object} ftl_data - The raw failure trace payload.
   * @returns {Promise<string>} The storage confirmation ID or reference.
   */
  async certifyAndLog(ftl_data) {
    this.validateSchema(ftl_data); // Synchronous validation
    
    try {
        const data_string = JSON.stringify(ftl_data);
        // The Signer performs cryptographic assertion based on initialized key material.
        const signed_record = this.signer.sign(data_string);
        
        // The Storage Provider handles secure, immutable append operation.
        const storage_reference = await this.storage.append(signed_record);

        // Standardized AGI operational logging for audit trail
        console.log(JSON.stringify({
            level: 'INFO',
            service: 'FTLS',
            message: 'FTL Certified and Committed',
            trace_id: ftl_data.trace_id || 'N/A',
            record_ref: storage_reference || 'N/A'
        }));

        return storage_reference;

    } catch (error) {
        // Wrap infrastructure errors to maintain FTLS context integrity.
        throw new Error(`FTL Certification or Storage Critical Failure: ${error.message}`);
    }
  }
}

module.exports = FailureTraceLogger_Service;
