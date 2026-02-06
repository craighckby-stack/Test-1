const { getProposalValidator } = require('../config/proposalSchemaFactory');

// Pre-compile the validator using the factory pattern for centralized configuration
const validate = getProposalValidator();

/**
 * Validates a proposed governance object against the GSC_SST schema.
 * 
 * Note: Since the underlying Ajv instance uses `useDefaults: true`, 
 * the input proposalData object is mutated (coerced, defaults applied) 
 * if validation is successful. The returned `canonicalData` reflects this mutation.
 * 
 * @param {object} proposalData - The data object submitted as a proposal (will be mutated).
 * @returns {{isValid: boolean, errors: array, canonicalData: object | null}}
 */
function validateProposal(proposalData) {
    const isValid = validate(proposalData);
    
    // proposalData is now the canonical (defaulted/coerced) version if isValid is true.
    const canonicalData = isValid ? proposalData : null;

    if (!isValid) {
        // Map Ajv errors to a cleaner, standardized internal structure.
        const errors = (validate.errors || []).map(err => ({
            dataPath: err.instancePath,
            message: err.message,
            keyword: err.keyword,
            params: err.params,
            schema: err.schemaPath // Added for better debugging
        }));

        return { isValid: false, errors, canonicalData: null };
    }

    return { 
        isValid: true, 
        errors: [], 
        canonicalData 
    };
}

module.exports = { validateProposal };