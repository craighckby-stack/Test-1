const { getProposalValidator } = require('../config/proposalSchemaFactory');
// Assuming ValidationExecutionUtility is available via dependency injection or module path
const { execute: ValidationExecutionUtility } = require('@plugin/ValidationExecutionUtility'); 

// The validator is pre-compiled using the factory pattern for maximum efficiency.
// It is stored in closure scope for fast access across module imports.
const proposalValidator = getProposalValidator();

/**
 * Validates a proposed governance object against the configured schema.
 * 
 * IMPORTANT: The execution logic (cloning, mutation handling, error formatting)
 * is delegated to the ValidationExecutionUtility.
 * 
 * @param {object} proposalData - The raw data object submitted as a proposal (Immutable input).
 * @returns {{isValid: boolean, errors: array, canonicalData: object | null}}
 */
function validateProposal(proposalData) {
    return ValidationExecutionUtility({
        data: proposalData,
        validator: proposalValidator
    });
}

module.exports = { validateProposal };
