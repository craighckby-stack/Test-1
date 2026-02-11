type ErrorContext = 'GENERATION' | 'VALIDATION' | 'LOAD' | 'OPERATION';

/**
 * IntegrityManifestError
 * Custom error class designed to handle structured aggregation of errors,
 * especially those arising from concurrent operations like hashing or validation.
 * 
 * IMPORTANT: This error class is strictly a data carrier and does not contain
 * kernel dependency resolution or complex external formatting logic.
 */
class IntegrityManifestError extends Error {
    public details: string[];
    public context: ErrorContext;

    /**
     * @param {string} message Primary error message.
     * @param {string[]} details Detailed list of errors (e.g., per-file failures).
     * @param {ErrorContext} context Operation context.
     */
    constructor(
        message: string,
        details: string[] = [],
        context: ErrorContext = 'OPERATION'
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
     * using internal, basic formatting. External formatting tools should be 
     * applied by consumers (e.g., LoggerKernel) who have access to strategic tools.
     * @returns {string}
     */
    get fullReport(): string {
        // Internal reporting logic
        let report = `[INTEGRITY FAILURE: ${this.context}] ${this.message}`;

        if (this.details.length > 0) {
            report += '\n\nDetailed Failures (' + this.details.length + ' total):';
            // Nicer formatting for array details
            report += this.details.map(detail => `\n -> ${detail}`).join('');
        }
        return report;
    }

    /**
     * Override standard toString() to provide the full error report.
     */
    toString(): string {
        return this.fullReport;
    }
}

export default IntegrityManifestError;