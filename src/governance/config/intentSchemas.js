/**
 * Governance Config: Intent Type Schema Registry
 * ID: GS-ITS-v94.1
 * Mandate: Centralized source of truth for all compliant Mutation Intent Package (M-XX) definitions.
 * Ensures strict compliance checks across the Policy Intent Factory and RSAM validator components.
 * Enhancement: Uses definition helpers, standardizes security levels, and enforces deep immutability.
 */

// --- Internal Constants & Helpers ---

const SECURITY_LEVELS = Object.freeze({
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
});

/**
 * Ensures a defined intent schema adheres to the required meta structure.
 * Freezes the individual definition to guarantee runtime integrity.
 * @param {string} id - M-XX identifier
 * @param {object} definition - Intent configuration
 * @returns {object} Frozen, validated intent definition
 */
const _defineIntent = (id, definition) => {
    if (!definition.type || typeof definition.priority !== 'number' || !definition.security) {
        throw new Error(`Intent Schema Definition Error for ${id}: Missing core required fields (type, priority, security).`);
    }
    if (!SECURITY_LEVELS[definition.security.riskAssessmentLevel]) {
        throw new Error(`Intent Schema Definition Error for ${id}: Invalid riskAssessmentLevel.`);
    }

    // Embed ID and ensure security sub-object is frozen
    definition.security = Object.freeze(definition.security);
    
    return Object.freeze({
        id,
        ...definition
    });
};

// --- Intent Schema Definitions ---

const rawIntentSchemas = {
    // M-01: Core Policy Modification (Highest Priority)
    M01: _defineIntent('M01', {
        type: 'POLICY_MODIFICATION_M01',
        description: 'Mandatory package for core regulatory policy schema alteration.',
        priority: 99, 
        security: {
            attestationRequired: true, 
            p01CalculationRequired: true, 
            riskAssessmentLevel: SECURITY_LEVELS.CRITICAL,
            ttlMinutes: 5 
        }
    }),
    
    // M-02: Resource Allocation Change (High Priority)
    M02: _defineIntent('M02', {
        type: 'RESOURCE_ALLOCATION_M02',
        description: 'Modification of system resource utilization schemas or budgets.',
        priority: 75,
        security: {
            attestationRequired: true,
            p01CalculationRequired: false, 
            riskAssessmentLevel: SECURITY_LEVELS.HIGH,
            ttlMinutes: 10
        }
    }),

    // M-03: System Configuration Audit Log Change (Medium Priority - Scalability Test)
    M03: _defineIntent('M03', {
        type: 'AUDIT_LOG_M03',
        description: 'Intent to alter parameters governing system audit log retention or visibility.',
        priority: 50,
        security: {
            attestationRequired: false, 
            p01CalculationRequired: true,
            riskAssessmentLevel: SECURITY_LEVELS.MEDIUM,
            ttlMinutes: 60
        }
    })
};

// Ensure the registry object itself cannot be modified after initialization
const IntentSchemas = Object.freeze(rawIntentSchemas);

module.exports = IntentSchemas;
