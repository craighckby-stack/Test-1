import Ajv from 'ajv';
import acvdSchema from './ACVD_schema.json';
import logger from '../utility/logger.js';

// Configure Ajv for robust error collection and strict compliance, essential for AGI governance quality control.
const ajv = new Ajv({
    allErrors: true,       // Collect all errors for comprehensive learning retention (Memory)
    coerceTypes: true,     // Helps with input flexibility
    strict: true           // Ensures schema compliance is strict, preventing silent errors (Logic/Robustness)
});

let validate;
let initialized = false;
let initErrorDetails = null; // Store context if schema compilation fails

try {
    validate = ajv.compile(acvdSchema);
    initialized = true;
    logger.info('ACVD Proposal Validator schema compiled successfully. (Strict compliance and robust error collection enabled)');
} catch (error) {
    logger.fatal('ACVD Validator Initialization FAILED: Schema compilation error.', error);
    initErrorDetails = {
        keyword: 'system_init_failure', 
        message: 'Validator failed to compile ACVD schema.', 
        errorContext: error.message
    };
    // Fallback: Ensure validate is a safe function that always fails validation contextually
    validate = () => false; 
}

/**
 * Parses, summarizes, and categorizes AJV errors for streamlined logging and advanced AGI self-correction analysis (Memory enhancement).
 * Focuses on extracting path, keyword, message, and providing error type counts for pattern recognition.
 * @param {Array<object>} errors - Raw AJV error objects (validate.errors).
 * @returns {{summary: Array<object>, counts: object}} Simplified error summary and keyword counts.
 */
function summarizeErrors(errors) {
    if (!errors) return { summary: [], counts: {} };
    
    const counts = {};
    
    const summary = errors.map(err => {
        const keyword = err.keyword || 'unknown';
        
        // Count the occurrence of each keyword (e.g., 'required', 'type')
        counts[keyword] = (counts[keyword] || 0) + 1;
        
        // Use instancePath for Ajv v8+ compatibility
        return {
            dataPath: err.instancePath,
            keyword: keyword,
            message: err.message,
            params: err.params
        };
    });
    
    return { summary: summary, counts: counts };
}

/**
 * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
 * Returns detailed and summarized errors for optimized AGI learning retention (Memory and Logic).
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, rawErrors: array|null, errorSummary: array|null, errorCounts: object|null}} The validation result.
 */
export function validateProposal(proposal) {
    const proposalId = proposal?.proposalId || 'N/A';

    if (!initialized) {
        logger.error(`Validator uninitialized due to schema error. Rejecting proposal ID ${proposalId}. Context stored in initErrorDetails.`);
        
        // Return structured initialization failure context
        return {
            isValid: false,
            rawErrors: [initErrorDetails],
            errorSummary: [{
                dataPath: '',
                keyword: initErrorDetails.keyword,
                message: initErrorDetails.message,
                params: { context: initErrorDetails.errorContext }
            }],
            errorCounts: { system_init_failure: 1 }
        };
    }

    const isValid = validate(proposal);

    if (!isValid) {
        const { summary, counts } = summarizeErrors(validate.errors);

        // Enhanced structured warning for better pattern recognition and learning retention
        logger.warn(`ACVD Proposal Validation Failed: ${summary.length} errors found. Proposal ID: ${proposalId}`, {
            errorCounts: counts, // High-level error categorization for rapid pattern matching (Logic)
            errorSummary: summary // Detailed path info (Memory)
        });

        return {
            isValid: false,
            rawErrors: validate.errors,
            errorSummary: summary, 
            errorCounts: counts 
        };
    }
    
    logger.info(`ACVD Proposal ${proposalId} validated successfully.`);
    return {
        isValid: true,
        rawErrors: null,
        errorSummary: null,
        errorCounts: null
    };
}