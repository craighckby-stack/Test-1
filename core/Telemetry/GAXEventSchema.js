/**
 * Telemetry Event Schema Definition (v94.1 AGI Enhancement).
 * Defines the required structure, types, and constraints for core GAX event payloads.
 * This structure supports runtime validation to ensure data consistency and quality.
 */

// --- Reusable Schema Field Definitions (Constants) ---
const RequiredString = Object.freeze({ type: 'string', required: true });
const RequiredNumber = Object.freeze({ type: 'number', required: true });
const OptionalBoolean = Object.freeze({ type: 'boolean', required: false });

const Formats = Object.freeze({
    VERSION: Object.freeze({ ...RequiredString, pattern: /^v[0-9]+\.[0-9]+(\.[0-9]+)?$/ }),
    UUID: Object.freeze({ ...RequiredString, format: 'uuid' }),
    SHA256: Object.freeze({ ...RequiredString, format: 'sha256' }),
    
    /**
     * Creates a schema definition for a SHA1 hash field.
     * @param {boolean} required - True if the field is mandatory (default: true).
     */
    SHA1: (required = true) => Object.freeze({ type: 'string', required: required, format: 'sha1' }),
});
// ---------------------------------------------------


const GAXEventSchema = Object.freeze({
    // System Lifecycle Events
    'SYS:INIT:START': {
        description: 'Records system version and entry parameters at startup.',
        schema: {
            version: Formats.VERSION,
            executionId: Formats.UUID,
            startupMode: Object.freeze({
                ...RequiredString,
                enum: ['standard', 'recovery', 'test', 'maintenance']
            })
        }
    },
    
    // Policy Verification Events
    'PV:REQUEST:INITIATED': {
        description: 'Records the beginning of a formal policy verification request.',
        schema: {
            policyType: Object.freeze({
                ...RequiredString,
                enum: ['security', 'compliance', 'resource']
            }),
            componentId: RequiredString,
            contextHash: Formats.SHA256,
            requestDataSize: Object.freeze({ type: 'number', required: false, min: 0 })
        }
    },
    
    // Autonomous Evolution Events
    'AXIOM:CODE:COMMITTED': {
        description: 'Logs successful commit of autonomously generated or evolved code.',
        schema: {
            targetFile: RequiredString,
            commitHash: Formats.SHA1(true),
            diffSize: Object.freeze({ ...RequiredNumber, min: 1 }),
            evolutionaryObjective: RequiredString,
            previousHash: Formats.SHA1(false) 
        }
    },
    
    // Diagnostic Events
    'DIAG:COMPONENT:FATAL_ERROR': {
        description: 'Reports a critical, system-halting error within a component.',
        schema: {
            componentName: RequiredString,
            errorCode: RequiredString,
            errorMessage: RequiredString,
            stackTrace: Object.freeze({ ...RequiredString, allowEmpty: true }),
            isRetryable: OptionalBoolean
        }
    }
});

module.exports = GAXEventSchema;