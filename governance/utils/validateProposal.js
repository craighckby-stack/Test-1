const { getProposalValidator } = require('../config/proposalSchemaFactory');

/**
 * Maps raw Ajv error objects to a standardized, consumable error structure.
 * Note: This utility should ideally be replaced by importing the scaffolded 
 * `governance/utils/formatValidationError.js` once created.
 * 
 * @param {Array<object>} ajvErrors 
 * @returns {Array<object>}
 */
const formatErrors = (ajvErrors = []) => {
    return ajvErrors.map(err => ({
        path: err.instancePath, 
        message: err.message,
        keyword: err.keyword,
        params: err.params,
        schemaPath: err.schemaPath,
    }));
};

// The validator is pre-compiled using the factory pattern for maximum efficiency.
const proposalValidator = getProposalValidator();

/**
 * Validates a proposed governance object against the configured schema.
 * 
 * IMPORTANT: The input `proposalData` is internally cloned before validation to maintain
 * functional purity and prevent side effects on the caller's object, while still allowing
 * the underlying Ajv instance (`useDefaults: true`) to apply defaults and coercion to the copy.
 * The processed copy is returned as `canonicalData`.
 * 
 * @param {object} proposalData - The raw data object submitted as a proposal (Immutable input).
 * @returns {{isValid: boolean, errors: array, canonicalData: object | null}}
 */
function validateProposal(proposalData) {
    if (typeof proposalData !== 'object' || proposalData === null) {
        // Immediate rejection for non-object/null input
        return { 
            isValid: false, 
            errors: [{ path: '', message: 'Proposal data must be a valid, non-null object.' }], 
            canonicalData: null 
        };
    }
    
    // Enforce immutability by shallow cloning the data before processing.
    const dataToProcess = { ...proposalData }; 
    
    const isValid = proposalValidator(dataToProcess);
    
    if (!isValid) {
        const errors = formatErrors(proposalValidator.errors);
        return { isValid: false, errors, canonicalData: null };
    }

    return { 
        isValid: true, 
        errors: [], 
        // dataToProcess now contains the canonical, defaulted, and coerced structure.
        canonicalData: dataToProcess 
    };
}

module.exports = { validateProposal };
