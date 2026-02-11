/**
 * Standardized function to transform validation library errors (e.g., Ajv errors) 
 * into the system's internal structured error format.
 * 
 * This module encapsulates dependency resolution and interaction with 
 * the SchemaErrorFormatterTool.
 */

class SchemaErrorFormatterImpl {
    #formatterTool;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Goal: Extract synchronous dependency resolution and initialization.
     */
    #setupDependencies() {
        try {
            // Resolve SchemaErrorFormatterTool and extract the format function
            const { format } = require('SchemaErrorFormatterTool');
            this.#formatterTool = format;
        } catch (error) {
            this.#throwDependencyError(error);
        }
    }

    /**
     * Goal: Isolate all interactions with external dependencies (tool execution).
     * @param {Array<object>} rawErrors
     * @returns {Array<object>} Structured error format.
     */
    #delegateToFormatterExecution(rawErrors) {
        // Executes the external formatting function
        return this.#formatterTool(rawErrors);
    }
    
    /**
     * Goal: Isolate custom error instantiation/throwing.
     */
    #throwDependencyError(error) {
        // Using a generic Error for dependency issues, maintaining consistency with separation goals.
        throw new Error(`[SchemaErrorFormatter] Failed to initialize dependency: SchemaErrorFormatterTool. Details: ${error.message}`);
    }

    /**
     * Public API method matching the original module export.
     * 
     * @param {Array<object>} rawErrors - Array of errors returned by the validation library.
     * @returns {Array<{path: string, message: string, keyword: string, params: object, schemaPath: string}>}
     */
    formatValidationError(rawErrors) {
        return this.#delegateToFormatterExecution(rawErrors);
    }
}

// Ensure a single, private instance is used to manage state and dependencies
const instance = new SchemaErrorFormatterImpl();

// Export the original public API wrapper
module.exports = {
    formatValidationError: instance.formatValidationError.bind(instance)
};
