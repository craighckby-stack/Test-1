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
 * Classifies the severity of an AJV error based on the keyword. 
 * Used for AGI self-correction prioritization and pattern recognition (Logic).
 * @param {string} keyword - The AJV error keyword (e.g., 'required', 'type').
 * @returns {('CRITICAL'|'MAJOR'|'MINOR')} Severity level.
 */
function classifyErrorSeverity(keyword) {
    switch (keyword) {
        case 'required':
        case 'additionalProperties':
        case 'dependencies':
        case 'not':
        case 'oneOf':
            return 'CRITICAL'; // Structural breakage, requires immediate architectural fix
        case 'type':
        case 'format':
        case 'minimum':
        case 'maximum':
            return 'MAJOR'; // Data integrity or functional mismatch
        default:
            return 'MINOR'; // Informational or contextual
    }
}

/**
 * Parses, summarizes, and categorizes AJV errors, calculating severity counts for 
 * streamlined logging and advanced AGI self-correction analysis (Memory/Logic enhancement).
 * @param {Array<object>} errors - Raw AJV error objects (validate.errors).
 * @returns {{summary: Array<object>, counts: object, severityCounts: object}} Simplified error summary, keyword counts, and severity counts.
 */
function summarizeErrors(errors) {
    if (!errors) return { summary: [], counts: {}, severityCounts: { CRITICAL: 0, MAJOR: 0, MINOR: 0 } };
    
    const counts = {};
    const severityCounts = { CRITICAL: 0, MAJOR: 0, MINOR: 0 };
    
    const summary = errors.map(err => {
        const keyword = err.keyword || 'unknown';
        const severity = classifyErrorSeverity(keyword);

        // Count occurrences
        counts[keyword] = (counts[keyword] || 0) + 1;
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        
        // Use instancePath for Ajv v8+ compatibility
        return {
            dataPath: err.instancePath,
            keyword: keyword,
            message: err.message,
            params: err.params,
            severity: severity // Added for AGI prioritization (Logic)
        };
    });
    
    return { summary: summary, counts: counts, severityCounts: severityCounts };
}

/**
 * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
 * Returns detailed and summarized errors for optimized AGI learning retention (Memory and Logic).
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, rawErrors: array|null, errorSummary: array|null, errorCounts: object|null, errorSeverityCounts: object|null}} The validation result.
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
                params: { context: initErrorDetails.errorContext },
                severity: 'CRITICAL'
            }],
            errorCounts: { system_init_failure: 1 },
            errorSeverityCounts: { CRITICAL: 1, MAJOR: 0, MINOR: 0 }
        };
    }

    const isValid = validate(proposal);

    if (!isValid) {
        const { summary, counts, severityCounts } = summarizeErrors(validate.errors);
        
        // Determine log level based on detected severity (Logic enhancement)
        let logLevel = 'warn';
        if (severityCounts.CRITICAL > 0) {
            logLevel = 'error'; // Upgrade log level if critical structural failure occurs
        }

        // Enhanced structured logging for better pattern recognition and learning retention
        logger[logLevel](
            `ACVD Proposal Validation Failed: ${summary.length} errors found (${severityCounts.CRITICAL} CRITICAL). Proposal ID: ${proposalId}`,
            {
                errorCounts: counts, 
                errorSummary: summary, 
                errorSeverityCounts: severityCounts
            }
        );

        return {
            isValid: false,
            rawErrors: validate.errors,
            errorSummary: summary, 
            errorCounts: counts,
            errorSeverityCounts: severityCounts
        };
    }
    
    logger.info(`ACVD Proposal ${proposalId} validated successfully.`);
    return {
        isValid: true,
        rawErrors: null,
        errorSummary: null,
        errorCounts: null,
        errorSeverityCounts: null
    };
}