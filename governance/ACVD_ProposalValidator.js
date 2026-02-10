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
 * Parses and summarizes AJV errors for streamlined logging and AGI self-correction analysis (Memory enhancement).
 * Focuses on extracting path, keyword, and message for pattern recognition.
 * @param {Array<object>} errors - Raw AJV error objects (validate.errors).
 * @returns {Array<{dataPath: string, keyword: string, message: string, params: object}>} Simplified error summary.
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
 * Returns detailed and summarized errors for optimized AGI learning retention.
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, rawErrors: array|null, errorSummary: array|null}} The validation result.
 */
export function validateProposal(proposal) {
    if (!initialized) {
        logger.error('Validator uninitialized due to schema error. Rejecting proposal.');
        const initError = { keyword: 'system', message: 'Validator failed to initialize. Check ACVD schema configuration.' };
        return {
            isValid: false,
            rawErrors: [initError],
            errorSummary: [{ keyword: 'system', message: 'Initialization failure.' }] // Simplified message for summary
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
            rawErrors: validate.errors, // Keep raw errors for deep context
            errorSummary: errorSummary  // Add structured summary for Memory/Logic agents
        };
    }
    
    logger.info(`ACVD Proposal ${proposalId} validated successfully.`);
    return {
        isValid: true,
        rawErrors: null,
        errorSummary: null
    };
}