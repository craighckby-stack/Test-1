import Ajv from 'ajv';
import acvdSchema from './ACVD_schema.json';
import logger from '../utility/logger.js';

// Configure Ajv for robust error collection, essential for AGI self-correction learning
const ajv = new Ajv({
    allErrors: true, // Collect all errors, not just the first one
    coerceTypes: true // Helps with input flexibility
});

let validate;
let initialized = false;

try {
    validate = ajv.compile(acvdSchema);
    initialized = true;
    logger.info('ACVD Proposal Validator schema compiled successfully. (Robust error collection enabled)');
} catch (error) {
    logger.fatal('ACVD Validator Initialization FAILED: Schema compilation error.', error);
    // Fallback: Ensure validate is a safe function that always fails validation
    validate = () => false;
}

/**
 * Parses and summarizes AJV errors for easier logging and AGI self-correction analysis (Memory enhancement).
 * @param {Array<object>} errors - Raw AJV error objects.
 * @returns {Array<object>} Simplified error summary.
 */
function summarizeErrors(errors) {
    if (!errors) return [];
    
    // Use instancePath for Ajv v8+ compatibility
    return errors.map(err => ({
        dataPath: err.instancePath,
        keyword: err.keyword,
        message: err.message,
        params: err.params
    }));
}

/**
 * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, errors: array}} Raw AJV errors are returned for maximum compatibility.
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
        const errorSummary = summarizeErrors(validate.errors);

        // Structured warning for better pattern recognition and learning retention
        logger.warn(`ACVD Proposal Validation Failed: ${errorSummary.length} errors found.`, {
            proposalId: proposalId,
            errorSummary: errorSummary
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