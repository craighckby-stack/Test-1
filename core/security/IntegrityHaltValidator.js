/**
 * core/security/IntegrityHaltValidator.js
 * 
 * Utility class to ensure critical Integrity Halt logs comply strictly with the
 * defined schema before cryptographic signing.
 */

import { SchemaValidator } from '../utility/SchemaValidator';
import IntegrityHaltSchema from '../../config/security/integrity_halt_schema.json';
import { SystemLogger } from '../system/SystemLogger';

export class IntegrityHaltValidator {
    
    constructor() {
        this.validator = new SchemaValidator(IntegrityHaltSchema);
        this.logger = new SystemLogger('IH_VALIDATOR');
    }

    /**
     * Executes strict validation against the mandated v2.0 Integrity Halt Schema.
     * If validation fails, it indicates a critical failure in the logging mechanism itself.
     * 
     * @param {object} logPayload - The generated Integrity Halt log object.
     * @returns {boolean} True if valid.
     * @throws {Error} Throws a hard error if the payload fails schema validation.
     */
    validate(logPayload) {
        const result = this.validator.validate(logPayload);
        
        if (!result.isValid) {
            // High-integrity systems must react severely to logging failures.
            this.logger.error('CRITICAL: Integrity Halt Log payload failed schema validation.', {
                errors: result.errors,
                payload_id: logPayload.IH_Identifier || 'UNKNOWN'
            });
            
            // Attempt to trigger the ultimate isolated error handling mechanism (if available)
            // IsolatedFailureReporter.report(result.errors);

            throw new Error(`SCHEMA VIOLATION: Halt Log failed structural validation. First Error: ${result.errors[0].message}`);
        }
        
        return true;
    }
}