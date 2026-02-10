const HALT_LOG_SCHEMA = Object.freeze({
    $id: 'IntegrityHaltLog',
    type: 'object',
    required: ['timestamp', 'reasonCode', 'details', 'attestationSource', 'signatureHash'],
    properties: {
        timestamp: {
            type: 'number',
            description: 'Unix timestamp in milliseconds.',
            minimum: 1600000000000
        },
        reasonCode: {
            type: 'string',
            description: 'Specific code identifying the halt cause.',
            pattern: '^[A-Z0-9_]{3,64}$'
        },
        details: {
            type: 'object',
            required: ['message', 'stackHash'],
            properties: {
                message: { type: 'string' },
                stackHash: { type: 'string', pattern: '^[0-9a-fA-F]{64}$' }
            }
        },
        attestationSource: {
            type: 'string',
            enum: ['KERNEL', 'HW_WATCHDOG', 'SEC_MODULE', 'TRUSTED_ENV']
        },
        signatureHash: {
             type: 'string',
             pattern: '^[0-9a-fA-F]{128}$',
             description: 'Cryptographic hash of the log content for signing pre-check.'
        }
    },
    additionalProperties: false
});

/**
 * IntegrityHaltValidator: Ensures critical halt logs conform strictly
 * to the defined integrity schema before signing/finalizing.
 * Relies on StrictSchemaValidator plugin for fatal failure handling.
 */
class IntegrityHaltValidator {
    /**
     * Validates a critical halt log entry, immediately halting the system
     * if the structural integrity is compromised.
     * @param {object} logEntry The log entry object to validate.
     * @returns {boolean} True if validation passes.
     */
    static validate(logEntry) {
        // Assumption: StrictSchemaValidator is available in the execution context
        if (typeof StrictSchemaValidator === 'undefined') {
             throw new Error('Kernel Dependency Missing: StrictSchemaValidator is required.');
        }
        
        // Delegation to the abstracted strict validation logic
        return StrictSchemaValidator.validate(logEntry, HALT_LOG_SCHEMA, 'IntegrityHaltLog');
    }

    /**
     * Retrieves the current validation schema.
     * @returns {object}
     */
    static getSchema() {
        return HALT_LOG_SCHEMA;
    }
}

module.exports = IntegrityHaltValidator;