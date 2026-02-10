const GSC_SST_Schema = require('../GSC_SST_Proposal_Schema.json');
const KernelPlugins = require('@agi-kernel/plugins'); 
const validatorFactory = KernelPlugins.HighIntegrityProposalValidatorFactory;

/**
 * Initializes and returns a compiled Ajv validator instance for proposals 
 * using the configured high-integrity factory service.
 * This centralizes configuration necessary for high-integrity validation.
 * @returns {function} A compiled validation function.
 */
function getProposalValidator() {
    // The factory internally applies security settings (e.g., removeAdditional: true)
    // and handles the compilation process.
    const validate = validatorFactory.execute({
        schema: GSC_SST_Schema
    });

    return validate;
}

module.exports = { getProposalValidator };