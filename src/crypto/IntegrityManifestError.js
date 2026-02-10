/**
 * IntegrityManifestError
 * Custom error class designed to handle structured aggregation of errors,
 * especially those arising from concurrent operations like hashing or validation.
 */

// Placeholder access for the kernel utility
const IntegrityErrorFormatter = (
  typeof __KERNEL__ !== 'undefined' && __KERNEL__.plugins && __KERNEL__.plugins.IntegrityErrorFormatter
) ? __KERNEL__.plugins.IntegrityErrorFormatter : null; 

class IntegrityManifestError extends Error {
    public details: string[];
    public context: 'GENERATION' | 'VALIDATION' | 'LOAD' | 'OPERATION';

    /**
     * @param {string} message Primary error message.
     * @param {string[]} details Detailed list of errors (e.g., per-file failures).
     * @param {('GENERATION'|'VALIDATION'|'LOAD'|'OPERATION')} context Operation context.
     */
    constructor(
        message: string,
        details: string[] = [],
        context: 'GENERATION' | 'VALIDATION' | 'LOAD' | 'OPERATION' = 'OPERATION'
    ) {
        super(message);
        this.name = 'IntegrityManifestError';
        this.details = details;
        this.context = context;

        // Capture stack trace, excluding the constructor call
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IntegrityManifestError);
        }
    }

    /**
     * Provides a consolidated report of the error and all detailed failures 
     * using the IntegrityErrorFormatter tool, if available.
     * @returns {string}
     */
    get fullReport(): string {
        if (IntegrityErrorFormatter && IntegrityErrorFormatter.formatReport) {
            return IntegrityErrorFormatter.formatReport(
                this.message,
                this.details,
                this.context
            );
        } else {
             // Fallback to original logic if formatter is not available
            let report = `[${this.context} FAILURE] ${this.message}`; 
            if (this.details.length > 0) {
                report += '\nDetailed Failures:\n - ' + this.details.join('\n - ');
            }
            return report;
        }
    }
}

export default IntegrityManifestError;
