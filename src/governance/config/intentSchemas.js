/**
 * Governance Config: Intent Type Schema Registry
 * ID: GS-ITS-v94
 * Mandate: Centralized source of truth for all compliant Mutation Intent Package (M-XX) definitions.
 * Ensures strict compliance checks across the Policy Intent Factory and RSAM validator components.
 */

const IntentSchemas = {
    // M-01: Core Policy Modification (Highest Priority)
    M01: {
        type: 'POLICY_MODIFICATION_M01',
        description: 'Mandatory package for core regulatory policy schema alteration.',
        priority: 99, 
        security: {
            attestationRequired: true, 
            p01CalculationRequired: true, 
            riskAssessmentLevel: 'CRITICAL',
            ttlMinutes: 5 // Time-to-live for transient execution validity
        }
    },
    // M-02: Resource Allocation Change (High Priority)
    M02: {
        type: 'RESOURCE_ALLOCATION_M02',
        description: 'Modification of system resource utilization schemas or budgets.',
        priority: 75,
        security: {
            attestationRequired: true,
            p01CalculationRequired: false, 
            riskAssessmentLevel: 'HIGH',
            ttlMinutes: 10
        }
    }
};

module.exports = IntentSchemas;