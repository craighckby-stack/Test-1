/**
 * Governance Config: Intent Type Schema Registry
 * ID: GS-ITS-v94.2
 * Mandate: Centralized source of truth for all compliant Mutation Intent Package (M-XX) definitions.
 * Defines intent metadata and links to required payload structures.
 * Ensures strict compliance checks across the Policy Intent Factory and RSAM validator components.
 * Enhancement: Removed definition ID redundancy, standardized structure, and mandated payload schema linkage.
 */

// --- Internal Constants & Helpers ---

const SECURITY_LEVELS = Object.freeze({
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
});

/**
 * Validates, normalizes, and recursively freezes an intent metadata definition.
 * The Intent ID (M-XX) is injected as 'id' automatically by the caller structure.
 * @param {string} key - M-XX identifier (e.g., 'M01')
 * @param {object} definition - Intent configuration data
 * @returns {object} Frozen, validated intent definition
 */
const defineIntentMetadata = (key, definition) => {
    // 1. Mandatory field check: payloadSchemaId is now mandatory for validation linkage.
    if (!definition.type || typeof definition.priority !== 'number' || !definition.security || !definition.payloadSchemaId) {
        throw new Error(`Intent Schema Definition Error for ${key}: Missing core required fields (type, priority, security, payloadSchemaId).`);
    }

    // 2. Security level validation
    if (!SECURITY_LEVELS[definition.security.riskAssessmentLevel]) {
        throw new Error(`Intent Schema Definition Error for ${key}: Invalid riskAssessmentLevel.`);
    }

    // 3. Immutability enforcement
    const security = Object.freeze(definition.security);

    return Object.freeze({
        id: key,
        ...definition,
        // Ensure the frozen sub-object is used in the final structure
        security: security
    });
};


// --- Raw Schema Definitions Source ---
// ID (key) is inferred from the structure, removing redundancy.

const IntentDefinitionSource = {
    // M-01: Core Policy Modification (Highest Priority)
    M01: {
        type: 'POLICY_MODIFICATION',
        description: 'Mandatory package for core regulatory policy schema alteration.',
        priority: 99, 
        payloadSchemaId: 'P-POL-001', // Links to the concrete payload structure
        security: {
            attestationRequired: true, 
            p01CalculationRequired: true, 
            riskAssessmentLevel: SECURITY_LEVELS.CRITICAL,
            ttlMinutes: 5 
        }
    },
    
    // M-02: Resource Allocation Change (High Priority)
    M02: {
        type: 'RESOURCE_ALLOCATION',
        description: 'Modification of system resource utilization schemas or budgets.',
        priority: 75,
        payloadSchemaId: 'P-RES-002', // Links to the concrete payload structure
        security: {
            attestationRequired: true,
            p01CalculationRequired: false, 
            riskAssessmentLevel: SECURITY_LEVELS.HIGH,
            ttlMinutes: 10
        }
    },

    // M-03: System Configuration Audit Log Change (Medium Priority)
    M03: {
        type: 'AUDIT_LOG_CONFIG',
        description: 'Intent to alter parameters governing system audit log retention or visibility.',
        priority: 50,
        payloadSchemaId: 'P-AUD-003', // Links to the concrete payload structure
        security: {
            attestationRequired: false, 
            p01CalculationRequired: true,
            riskAssessmentLevel: SECURITY_LEVELS.MEDIUM,
            ttlMinutes: 60
        }
    }
};

// --- Initialization and Export ---

// Process raw definitions, embed key as 'id', and apply strict immutability checks.
const IntentSchemas = Object.freeze(
    Object.entries(IntentDefinitionSource).reduce((acc, [key, definition]) => {
        acc[key] = defineIntentMetadata(key, definition);
        return acc;
    }, {})
);

module.exports = IntentSchemas;
