/**
 * Unified System Logger Utility
 * Provides structured, context-aware logging, leveraging StructuralLogFormatterUtility.
 */

// ==================================================================
// TYPE DEFINITIONS (Simulating kernel environment declarations)
// ==================================================================

interface StructuralLoggerInterface {
    execute: (level: string, context: string, message: string, data?: any) => void;
}

// Simulate access to the external logging utility function provided by the kernel.
declare const StructuralLogFormatterUtility: StructuralLoggerInterface;

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'SUCCESS';

export default class Logger {
    private context: string;

    /**
     * Maps custom log levels to standard browser/node console methods for fallback.
     */
    private static CONSOLE_METHOD_MAP: Record<LogLevel, keyof Console> = {
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error',
        FATAL: 'error', 
        SUCCESS: 'log' 
    };

    /**
     * @param {string} context - The module or service initiating the log (e.g., 'SpecificationLoader').
     */
    constructor(context: string = 'System') {
        this.context = context;
    }

    /**
     * Retrieves the appropriate console function for fallback logging based on the LogLevel.
     */
    private _getConsoleMethod(level: LogLevel): (message?: any, ...optionalParams: any[]) => void {
        const methodKey = Logger.CONSOLE_METHOD_MAP[level];
        // Ensure we always return a callable function, falling back to console.log
        return console[methodKey] || console.log;
    }

    /**
     * Handles core logging by delegating formatting and output to the external utility,
     * or using a structured console fallback.
     */
    private _log(level: LogLevel, message: string, data?: any): void {
        const levelStr = level.toUpperCase();

        // 1. Primary Path: Use kernel utility
        if (typeof StructuralLogFormatterUtility !== 'undefined' && StructuralLogFormatterUtility.execute) {
            StructuralLogFormatterUtility.execute(levelStr, this.context, message, data);
            return;
        }

        // 2. Fallback Path: Structured Console Logging
        const timestamp = new Date().toISOString();
        
        const dataOutput = data ? ` (Data: ${JSON.stringify(data)})` : '';
        const logMethod = this._getConsoleMethod(level);
        
        // Format: [TIMESTAMP] [LEVEL] (CONTEXT): MESSAGE DATA
        logMethod(`[${timestamp}] [${levelStr}] (${this.context}): ${message}${dataOutput}`);
    }

    info(message: string, data?: any): void { this._log('INFO', message, data); }
    warn(message: string, data?: any): void { this._log('WARN', message, data); }
    error(message: string, data?: any): void { this._log('ERROR', message, data); }
    
    // Specialized severe logging
    fatal(message: string, data?: any): void { this._log('FATAL', message, data); }
    success(message: string, data?: any): void { this._log('SUCCESS', message, data); }
}