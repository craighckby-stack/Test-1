// core/Telemetry/GAXEventRegistry.js
/**
 * Standardized Event Names for the GAX Telemetry Service.
 * These constants must be used as the 'eventName' argument in GAXTelemetryService.publish() 
 * to ensure consistency and prevent typos in monitoring and logging systems.
 */
const GAXEventRegistry = Object.freeze({
    // Core Lifecycle Events
    LIFECYCLE_INIT_START: 'LIFECYCLE_INIT_START',
    LIFECYCLE_INIT_COMPLETE: 'LIFECYCLE_INIT_COMPLETE',
    LIFECYCLE_EXECUTION_START: 'LIFECYCLE_EXECUTION_START',
    LIFECYCLE_EXECUTION_END: 'LIFECYCLE_EXECUTION_END',
    
    // Policy Verification Events (PVF)
    PVF_REQUESTED: 'POLICY_VERIFICATION_REQUESTED',
    PVF_SUCCESS: 'POLICY_VERIFICATION_SUCCESS',
    PVF_FAILURE: 'POLICY_VERIFICATION_FAILURE',
    
    // Axiom Component Events (Axiom Generation/Evolution)
    AXIOM_GENERATION_START: 'AXIOM_GEN_START',
    AXIOM_EVOLUTION_STEP: 'AXIOM_EVOLVE_STEP',
    AXIOM_COMMIT_SUCCESS: 'AXIOM_COMMIT_SUCCESS',
    
    // System Diagnostics/Errors
    DIAG_CONFIGURATION_ERROR: 'DIAG_CONFIGURATION_ERROR',
    DIAG_CONTEXT_MISSING: 'DIAG_CONTEXT_MISSING',
    DIAG_INTERNAL_ERROR: 'DIAG_INTERNAL_ERROR',
    
    // Generic Component Actions
    ACTION_TRIGGERED: 'ACTION_TRIGGERED',
    ACTION_PROCESSED: 'ACTION_PROCESSED'
});

module.exports = GAXEventRegistry;