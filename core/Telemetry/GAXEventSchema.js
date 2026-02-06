/**
 * Telemetry Event Schema Definition.
 * Defines the required and optional data payload fields for core GAX events.
 * Used by the GAXTelemetryService to validate outgoing events, ensuring data consistency
 * and quality across all system metrics.
 */
const GAXEventSchema = Object.freeze({
    // System Lifecycle Events
    'SYS:INIT:START': {
        required: ['version', 'executionId', 'startupMode'],
        description: 'Records system version and entry parameters at startup.'
    },
    
    // Policy Verification Events
    'PV:REQUEST:INITIATED': {
        required: ['policyType', 'componentId', 'contextHash'],
        optional: ['requestDataSize'],
        description: 'Records the beginning of a formal policy verification request.'
    },
    
    // Autonomous Evolution Events
    'AXIOM:CODE:COMMITTED': {
        required: ['targetFile', 'commitHash', 'diffSize', 'evolutionaryObjective'],
        optional: ['previousHash'],
        description: 'Logs successful commit of autonomously generated or evolved code.'
    },
    
    // Diagnostic Events
    'DIAG:COMPONENT:FATAL_ERROR': {
        required: ['componentName', 'errorCode', 'errorMessage', 'stackTrace'],
        description: 'Reports a critical, system-halting error within a component.'
    }
});

module.exports = GAXEventSchema;