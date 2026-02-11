/**
 * CIM Governance Codes v94.1
 * Provides centralized storage for system constants, critical target definitions,
 * and governance error codes related to the Configuration Integrity Monitor (CIM).
 */

/**
 * Defines the critical configuration files that MUST be integrity monitored by CIM.
 * These targets are mandatory for system operational integrity.
 * @type {ReadonlyArray<string>}
 */
const CRITICAL_TARGETS = Object.freeze([
    'config/governance.yaml', 
    'config/veto_mandates.json',
    'config/security_policies.json'
]);

/**
 * Defines internal error, event, and operational codes for strict traceability
 * within the Configuration Integrity Monitor (CIM) subsystem.
 * @type {Readonly<Object<string, string>>}
 */
const CIM_CODES = Object.freeze({
    // --- Initialization and State Codes ---
    INIT_FAILURE: 'E941A',
    UNINITIALIZED_ACCESS: 'E941B',
    LEDGER_INTERFACE_MISSING: 'E941C',
    INIT_VETO: 'CIM_INIT_VETO',
    INIT_FATAL: 'CIM_INIT_FATAL',
    
    // --- Integrity Veto Codes (Security Policy Enforcement) ---
    UNTRACKED_VETO: 'D941C', // Configuration path is untracked.
    MUTATION_VETO: 'D941D', // Hash mismatch detected.

    // --- Update/Commit Codes ---
    UPDATE_VETO: 'E941E', // Update rejected (A-01 validation failure).
    D01_COMMIT_FAILURE: 'D01_COMMIT_FAILURE'
});

module.exports = {
    CRITICAL_TARGETS,
    CIM_CODES
};
