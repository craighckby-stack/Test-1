import Ajv from 'ajv';
import acvdSchema from './ACVD_schema.json';
import logger from '../utility/logger.js';

const ajv = new Ajv();
let validate;
let initialized = false;

try {
    validate = ajv.compile(acvdSchema);
    initialized = true;
    logger.info('ACVD Proposal Validator schema compiled successfully.');
} catch (error) {
    logger.fatal('ACVD Validator Initialization FAILED: Schema compilation error.', error);
    // Fallback: Ensure validate is a safe function that always fails validation
    validate = () => false;
}

/**
 * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, errors: array}}
 */
export function validateProposal(proposal) {
    if (!initialized) {
        logger.error('Validator uninitialized due to schema error. Rejecting proposal.');
        return {
            isValid: false,
            errors: [{ keyword: 'system', message: 'Validator failed to initialize. Check ACVD schema configuration.' }]
        };
    }

    const isValid = validate(proposal);
    const proposalId = proposal?.proposalId || 'N/A';

    if (!isValid) {
        // Structured warning for better pattern recognition in error logs
        logger.warn('ACVD Proposal Validation Failed.', {
            proposalId: proposalId,
            errors: validate.errors
        });
        return {
            isValid: false,
            errors: validate.errors
        };
    }
    
    logger.info(`ACVD Proposal ${proposalId} validated successfully.`);
    return {
        isValid: true,
        errors: null
    };
}
