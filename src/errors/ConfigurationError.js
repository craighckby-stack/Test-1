/**
 * Custom error class for reporting configuration, environment variable,
 * or initialization failures.
 *
 * It is categorized as an 'Operational Error' meaning it relates to
 * issues outside the program's immediate logic (e.g., environment setup,
 * connectivity, validation failure), and should be handled gracefully.
 */
export class ConfigurationError extends Error {
    public isOperational: boolean;
    public code: string;
    public context: object;

    /**
     * @param {string} message - Human-readable description of the error.
     * @param {string} [code] - Machine-readable error code (e.g., 'MISSING_ENV', 'INVALID_SCHEMA').
     * @param {Object} [context={}] - Additional details relevant for debugging.
     */
    constructor(message: string, code?: string, context: object = {}) {
        super(message);
        this.name = 'ConfigurationError';
        
        // Use the initializer tool to handle operational flags, context, and stack trace management.
        OperationalErrorInitializerUtility.initialize(
            this, 
            ConfigurationError, 
            code || 'E_CONFIG_GENERIC', // Default if code is not provided in constructor
            context
        );
    }

    /**
     * Provides a standardized string representation including the machine code and category.
     * @returns {string}
     */
    toString(): string {
        return `[${this.name}:${this.code}] ${this.message}`;
    }
}