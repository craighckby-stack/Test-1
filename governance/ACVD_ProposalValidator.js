import Ajv from 'ajv';
import acvdSchema from './ACVD_schema.json';
import logger from '../utility/logger.js';
import StrictSchemaValidator from 'AGI_PLUGIN/StrictSchemaValidator';

// --- AGI Plugin Integration: SchemaErrorAnalyzer ---
// Defines the interface for the externally managed error analysis tool
interface IErrorAnalyzer {
    analyze: (errors: any[]) => { summary: any[], counts: { [key: string]: number }, severityCounts: { [key: string]: number } };
}

// Simulated lookup/injection of the tool instance (AGI Kernel dependency injection point).
const errorAnalyzer: IErrorAnalyzer = (globalThis as any).SchemaErrorAnalyzer || {
    analyze: (errors) => { 
        return { summary: [], counts: {}, severityCounts: { CRITICAL: 0, MAJOR: 0, MINOR: 0 } };
    }
};
// ----------------------------------------------------


// Initialize the robust validator using the plugin
const acvdValidator = new StrictSchemaValidator(acvdSchema, 'ACVD Proposal Validator');

if (!acvdValidator.isInitialized) {
    const details = acvdValidator.getInitErrorDetails();
    logger.fatal('ACVD Validator Initialization FAILED: Schema compilation error.', details);
    // Note: The validator handles the fallback function internally.
} else {
    logger.info('ACVD Proposal Validator schema compiled successfully. (Strict compliance and robust error collection enabled)');
}

/**
 * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
 * Returns detailed and summarized errors for optimized AGI learning retention (Memory and Logic).
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, rawErrors: array|null, errorSummary: array|null, errorCounts: object|null, errorSeverityCounts: object|null}} The validation result.
 */
export function validateProposal(proposal: object) {
    const proposalId = (proposal as any)?.proposalId || 'N/A';

    // Use the StrictSchemaValidator plugin for robust validation
    const { isValid, rawErrors, initErrorDetails } = acvdValidator.validate(proposal);

    // Handle System Initialization Failure path
    if (initErrorDetails) {
        logger.error(`Validator uninitialized due to schema error. Rejecting proposal ID ${proposalId}. Context stored in initErrorDetails.`);
        
        // Return structured initialization failure context, manually formatted
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

    if (!isValid) {
        // Use the SchemaErrorAnalyzer plugin for structured analysis
        // rawErrors is guaranteed to be present here if initialized and invalid
        const { summary, counts, severityCounts } = errorAnalyzer.analyze(rawErrors!); 
        
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
            rawErrors: rawErrors,
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