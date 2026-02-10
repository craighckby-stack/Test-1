/**
 * ACVD Policy Configuration Schema Definition.
 * This JSON schema defines the mandatory structure and expected types 
 * for the governance constants loaded by the DynamicPolicyCache.
 * 
 * NOTE: The structure has been corrected to comply with standard JSON Schema (using $id and properties).
 */

const ACVDIntegritySchema = {
    type: 'object',
    $id: 'ACVD_V94_1_PolicyConfig', // Standard JSON Schema identifier
    required: ['policy_thresholds', 'attestation_requirements'],
    properties: {
        policy_thresholds: {
            type: 'object',
            required: ['integrity_veto_bounds', 'utility_maximization'],
            properties: {
                integrity_veto_bounds: {
                    type: 'object',
                    required: ['max_pvlm_failures', 'max_mpam_failures'],
                    properties: { // Corrected from 'schema'
                        max_pvlm_failures: { type: 'number', minimum: 0 },
                        max_mpam_failures: { type: 'number', minimum: 0 }
                    }
                },
                utility_maximization: {
                    type: 'object',
                    required: ['UFRM'],
                    properties: { // Corrected from 'schema'
                        UFRM: { type: 'number' }
                    }
                }
            }
        },
        attestation_requirements: {
            type: 'object',
            required: ['ecvm_required'],
            properties: { // Corrected from 'schema'
                ecvm_required: { type: 'boolean' }
            }
        }
    }
};

module.exports = ACVDIntegritySchema;