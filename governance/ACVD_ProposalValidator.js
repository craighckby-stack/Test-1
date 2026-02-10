import Ajv from 'ajv';
import acvdSchema from './ACVD_schema.json';
import logger from '../utility/logger.js';

// --- AGI Plugin Integration: SchemaErrorAnalyzer ---
// Defines the interface for the externally managed error analysis tool
interface IErrorAnalyzer {
    analyze: (errors: any[]) => { summary: any[], counts: { [key: string]: number }, severityCounts: { [key: string]: number } };
}

// Simulated lookup/injection of the tool instance (AGI Kernel dependency injection point).
// Note: This fallback must match the expected output structure if injection fails.
const errorAnalyzer: IErrorAnalyzer = (globalThis as any).SchemaErrorAnalyzer || {
    analyze: (errors) => { 
        return { summary: [], counts: {}, severityCounts: { CRITICAL: 0, MAJOR: 0, MINOR: 0 } };
    }
};
// ----------------------------------------------------


// Configure Ajv for robust error collection and strict compliance, essential for AGI governance quality control.
const ajv = new Ajv({
    allErrors: true,       // Collect all errors for comprehensive learning retention (Memory)
    coerceTypes: true,     // Helps with input flexibility
    strict: true           // Ensures schema compliance is strict, preventing silent errors (Logic/Robustness)
});

let validate: Ajv.ValidateFunction;
let initialized = false;
let initErrorDetails: { keyword: string, message: string, errorContext: string } | null = null; // Store context if schema compilation fails

try {
    validate = ajv.compile(acvdSchema);
    initialized = true;
    logger.info('ACVD Proposal Validator schema compiled successfully. (Strict compliance and robust error collection enabled)');
} catch (error) {
    logger.fatal('ACVD Validator Initialization FAILED: Schema compilation error.', error);
    initErrorDetails = {
        keyword: 'system_init_failure', 
        message: 'Validator failed to compile ACVD schema.', 
        errorContext: error instanceof Error ? error.message : String(error)
    };
    // Fallback: Ensure validate is a safe function that always fails validation contextually
    validate = () => false; 
}

/**
 * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
 * Returns detailed and summarized errors for optimized AGI learning retention (Memory and Logic).
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, rawErrors: array|null, errorSummary: array|null, errorCounts: object|null, errorSeverityCounts: object|null}} The validation result.
 */
export function validateProposal(proposal: object) {
    const proposalId = (proposal as any)?.proposalId || 'N/A';

    if (!initialized) {
        logger.error(`Validator uninitialized due to schema error. Rejecting proposal ID ${proposalId}. Context stored in initErrorDetails.`);
        
        // Return structured initialization failure context, manually formatted to match tool output structure
        return {
            isValid: false,
            rawErrors: [initErrorDetails],
            errorSummary: [{
                dataPath: '',
                keyword: initErrorDetails!.keyword,
                message: initErrorDetails!.message,
                params: { context: initErrorDetails!.errorContext },
                severity: 'CRITICAL'
            }],
            errorCounts: { system_init_failure: 1 },
            errorSeverityCounts: { CRITICAL: 1, MAJOR: 0, MINOR: 0 }
        };
    }

    const isValid = validate(proposal);

    if (!isValid) {
        // Use the SchemaErrorAnalyzer plugin for structured analysis
        const { summary, counts, severityCounts } = errorAnalyzer.analyze(validate.errors!);
        
        // Determine log level based on detected severity (Logic enhancement)
        let logLevel: 'warn' | 'error' = 'warn';
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