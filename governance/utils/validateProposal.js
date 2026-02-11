const { getProposalValidator } = require('../config/proposalSchemaFactory');
const { createBoundValidator } = require('@plugin/ValidatorBinderUtility');

/**
 * Validates a proposed governance object against the configured schema.
 * 
 * Note: The validator instance is initialized within the plugin factory 
 * closure for maximum efficiency (pre-compiled access).
 * 
 * @param {object} proposalData - The raw data object submitted as a proposal (Immutable input).
 * @returns {{isValid: boolean, errors: array, canonicalData: object | null}}
 */
const validateProposal = createBoundValidator(getProposalValidator);

module.exports = { validateProposal };
