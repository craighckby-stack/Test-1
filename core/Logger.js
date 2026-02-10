/**
 * Unified System Logger Utility
 * Provides structured, context-aware logging, leveraging StructuralLogFormatterUtility.
 */

// Simulate access to the external logging utility function provided by the kernel.
declare const StructuralLogFormatterUtility: { 
    execute: (level: string, context: string, message: string, data?: any) => void 
};

export default class Logger {
    private context: string;

    /**
     * @param {string} context - The module or service initiating the log (e.g., 'SpecificationLoader').
     */
    constructor(context: string = 'System') {
        this.context = context;
    }

    /**
     * Handles core logging by delegating formatting and output to the external utility.
     * Includes a simple fallback if the utility is not defined.
     */
    private _log(level: string, message: string, data?: any): void {
        if (typeof StructuralLogFormatterUtility !== 'undefined' && StructuralLogFormatterUtility.execute) {
            StructuralLogFormatterUtility.execute(level, this.context, message, data);
        } else {
            // Fallback logging
            const entry = {
                timestamp: new Date().toISOString(),
                level: level.toUpperCase(),
                context: this.context,
                message: message
            };
            const output = data ? JSON.stringify(data) : '';
            // Safe type casting for console method access
            const logMethod = console[level.toLowerCase() as keyof Console] || console.log;
            logMethod(`[${entry.timestamp}] [${entry.level}] (${entry.context}): ${entry.message} ${output}`.trim());
        }
    }

    info(message: string, data?: any): void { this._log('INFO', message, data); }
    warn(message: string, data?: any): void { this._log('WARN', message, data); }
    error(message: string, data?: any): void { this._log('ERROR', message, data); }
    
    // Specialized severe logging
    fatal(message: string, data?: any): void { this._log('FATAL', message, data); }
    success(message: string, data?: any): void { this._log('SUCCESS', message, data); }
}