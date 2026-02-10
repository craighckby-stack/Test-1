// core/Telemetry/GAXEventRegistry.js

/**
 * Helper to construct the standardized event name: NAMESPACE:SUBDOMAIN:ACTION
 * @param {string} namespace 
 * @param {string} subdomain 
 * @param {string} action 
 * @returns {string}
 */
const _createEvent = (namespace, subdomain, action) => 
    `${namespace}:${subdomain}:${action}`;

/**
 * Standardized Event Names for the GAX Telemetry Service (Global Autonomous X-System).
 * 
 * Structure: NAMESPACE:SUBDOMAIN:ACTION
 * Ensures consistency, machine readability, effective filtering, and standardized consumption.
 */
const GAXEventRegistry = Object.freeze({
    // ----------------------------------------
    // System Lifecycle (SYS)
    // ----------------------------------------
    SYS_INIT_START: _createEvent('SYS', 'INIT', 'START'),
    SYS_INIT_COMPLETE: _createEvent('SYS', 'INIT', 'COMPLETE'),
    SYS_EXECUTION_START: _createEvent('SYS', 'EXECUTION', 'START'),
    SYS_EXECUTION_END: _createEvent('SYS', 'EXECUTION', 'END'),
    SYS_SHUTDOWN: _createEvent('SYS', 'SHUTDOWN', 'IMMINENT'), // Standardized to include SUBDOMAIN and ACTION

    // ----------------------------------------
    // Policy & Verification (PV)
    // ----------------------------------------
    PV_REQUEST_INITIATED: _createEvent('PV', 'REQUEST', 'INITIATED'),
    PV_RULE_CHECK_SUCCESS: _createEvent('PV', 'RULE', 'CHECK_SUCCESS'),
    PV_RULE_CHECK_FAILURE: _createEvent('PV', 'RULE', 'CHECK_FAILURE'),
    PV_ACCESS_DENIED: _createEvent('PV', 'ACCESS', 'DENIED'), 

    // ----------------------------------------
    // Autonomous Evolution (AXIOM)
    // ----------------------------------------
    AXIOM_GENERATION_START: _createEvent('AXIOM', 'GENERATION', 'START'),
    AXIOM_EVOLUTION_STEP_PERFORMED: _createEvent('AXIOM', 'EVOLUTION', 'STEP_PERFORMED'),
    AXIOM_CODE_COMMITTED: _createEvent('AXIOM', 'CODE', 'COMMITTED'),
    AXIOM_CODE_REVERTED: _createEvent('AXIOM', 'CODE', 'REVERTED'),
    AXIOM_TEST_RUN_SUCCESS: _createEvent('AXIOM', 'TEST', 'RUN_SUCCESS'),
    AXIOM_TEST_RUN_FAILURE: _createEvent('AXIOM', 'TEST', 'RUN_FAILURE'),

    // ----------------------------------------
    // Planning and Context Management (PLAN)
    // ----------------------------------------
    PLAN_GOAL_DEFINED: _createEvent('PLAN', 'GOAL', 'DEFINED'),
    PLAN_STEP_GENERATED: _createEvent('PLAN', 'STEP', 'GENERATED'),
    PLAN_STEP_COMPLETED: _createEvent('PLAN', 'STEP', 'COMPLETED'),
    PLAN_CONTEXT_RETRIEVAL_START: _createEvent('PLAN', 'CONTEXT', 'RETRIEVAL_START'),
    PLAN_CONTEXT_RETRIEVAL_COMPLETE: _createEvent('PLAN', 'CONTEXT', 'RETRIEVAL_COMPLETE'),

    // ----------------------------------------
    // External API Interaction (API)
    // ----------------------------------------
    API_REQUEST_SENT: _createEvent('API', 'EXTERNAL', 'REQUEST_SENT'),
    API_RESPONSE_RECEIVED: _createEvent('API', 'EXTERNAL', 'RESPONSE_RECEIVED'),
    API_RATE_LIMIT_HIT: _createEvent('API', 'EXTERNAL', 'RATE_LIMIT_HIT'), 

    // ----------------------------------------
    // Data/Context Storage (DATA)
    // ----------------------------------------
    DATA_CACHE_HIT: _createEvent('DATA', 'CACHE', 'HIT'),
    DATA_CACHE_MISS: _createEvent('DATA', 'CACHE', 'MISS'),
    DATA_STORAGE_WRITE_FAILURE: _createEvent('DATA', 'STORAGE', 'WRITE_FAILURE'), 

    // ----------------------------------------
    // System Diagnostics, Errors, and Warnings (DIAG)
    // ----------------------------------------
    DIAG_CONFIGURATION_FAULT: _createEvent('DIAG', 'CONFIGURATION', 'FAULT'),
    DIAG_CONTEXT_RESOLUTION_MISSING: _createEvent('DIAG', 'CONTEXT', 'RESOLUTION_MISSING'),
    DIAG_COMPONENT_FATAL_ERROR: _createEvent('DIAG', 'COMPONENT', 'FATAL_ERROR'),
    DIAG_WARNING_THRESHOLD_EXCEEDED: _createEvent('DIAG', 'WARNING', 'THRESHOLD_EXCEEDED'),

    // ----------------------------------------
    // Telemetry Infrastructure (TEL)
    // ----------------------------------------
    TEL_PUBLISH_SUCCESS: _createEvent('TEL', 'PUBLISH', 'SUCCESS'),
    TEL_PUBLISH_FAILURE: _createEvent('TEL', 'PUBLISH', 'FAILURE'),
    TEL_DATA_DROPPED: _createEvent('TEL', 'DATA', 'DROPPED')
});

module.exports = GAXEventRegistry;