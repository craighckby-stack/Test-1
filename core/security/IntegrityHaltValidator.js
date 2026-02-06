/**
 * core/security/IntegrityHaltValidator.js
 * 
 * Static utility for strictly validating critical Integrity Halt logs against 
 * the defined structural schema before cryptographic signing.
 * Failures here indicate a system-level integrity breach in logging mechanisms.
 */

import { SchemaValidator } from '../utility/SchemaValidator';
import IntegrityHaltSchema from '../../config/security/integrity_halt_schema.json';
import { SystemLogger } from '../system/SystemLogger';
import { IsolatedFailureReporter } from '../system/IsolatedFailureReporter'; 

const LOG_SOURCE = 'IH_VALIDATOR';
const validator = new SchemaValidator(IntegrityHaltSchema);
const logger = new SystemLogger(LOG_SOURCE);

export class IntegrityHaltValidator {
    
    // Prevent instantiation, as this is a static utility class.
    constructor() {
        throw new Error("IntegrityHaltValidator is a static utility class and should not be instantiated.");
    }

    /**
     * Executes strict validation against the mandated Integrity Halt Schema.
     * 
     * @param {object} logPayload - The generated Integrity Halt log object.
     * @returns {void} Throws an error if invalid.
     */
    static validate(logPayload) {
        const result = validator.validate(logPayload);
        
        if (!result.isValid) {
            const identifier = logPayload.IH_Identifier || 'UNKNOWN';
            
            // 1. Log the failure critically.
            logger.critical(`CRITICAL SCHEMA FAILURE: Integrity Halt Log payload (ID: ${identifier}) failed validation.`, {
                errors: result.errors,
                payload_id: identifier
            });
            
            // 2. Report the failure through the isolated mechanism.
            // This guarantees the failure is recorded even if the main system state is compromised.
            if (IsolatedFailureReporter) {
                IsolatedFailureReporter.report({
                    source: LOG_SOURCE,
                    severity: 'CRITICAL',
                    message: 'Integrity Halt Log Schema Violation',
                    errors: result.errors,
                    payload_id: identifier
                });
            }

            // 3. Halt execution immediately.
            throw new Error(`SCHEMA VIOLATION HALT: Halt Log failed structural validation. First Error: ${result.errors[0].message}`);
        }
    }
}