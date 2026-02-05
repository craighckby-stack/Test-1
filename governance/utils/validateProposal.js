const Ajv = require('ajv');
const schema = require('../GSC_SST_Proposal_Schema.json');

// Configure AJV with settings necessary for production system validation
const ajv = new Ajv({
    allErrors: true, 
    coerceTypes: true,
    useDefaults: true // Applies defaults specified in the schema
});

const validate = ajv.compile(schema);

/**
 * Validates a proposed governance object against the GSC_SST schema.
 * @param {object} proposalData - The data object submitted as a proposal.
 * @returns {{isValid: boolean, errors: array}}
 */
function validateProposal(proposalData) {
    const isValid = validate(proposalData);
    
    if (!isValid) {
        // Enhance error reporting for cleaner system logs
        const errors = validate.errors.map(err => ({
            dataPath: err.instancePath,
            message: err.message,
            keyword: err.keyword,
            params: err.params
        }));

        return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
}

module.exports = { validateProposal };