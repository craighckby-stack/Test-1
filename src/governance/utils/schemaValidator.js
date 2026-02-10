/**
 * SchemaValidator Utility Proxy
 * Delegates validation and compilation tasks to the HighPerformanceSchemaCompilerTool.
 * V97.1.0: Refactored to use dedicated Kernel Tool.
 */

// Conceptual access to the kernel tool interface. In a production environment,
// this reference would be securely injected or resolved via a service locator.
const SchemaCompilerTool = globalThis.AGI_KERNEL_TOOLS?.HighPerformanceSchemaCompilerTool || {
    // Provide graceful fallbacks if the tool is not yet loaded/available
    compile: (s) => { throw new Error("HighPerformanceSchemaCompilerTool is unavailable."); },
    validate: (s, d) => ({
        isValid: false,
        errors: [{ message: "HighPerformanceSchemaCompilerTool is unavailable.", keyword: 'system' }]
    })
};

/**
 * Proxy class for Schema Validation operations.
 */
class SchemaValidator {
    constructor() {
        // Initialization is lightweight as the heavy lifting is delegated.
    }

    /**
     * Compiles a JSON Schema into a reusable, high-performance validation function.
     * Delegates to the HighPerformanceSchemaCompilerTool.
     * @param {object} schema - The JSON Schema definition.
     * @returns {Function} The compiled validation function.
     * @throws {Error} If schema compilation fails or tool is missing.
     */
    compile(schema) {
        if (typeof SchemaCompilerTool.compile !== 'function') {
             throw new Error("HighPerformanceSchemaCompilerTool compile function is missing.");
        }
        return SchemaCompilerTool.compile(schema);
    }

    /**
     * Helper method to directly validate data against a raw schema.
     * Delegates to the HighPerformanceSchemaCompilerTool.
     */
    validate(schema, data) {
        if (typeof SchemaCompilerTool.validate !== 'function') {
            return { isValid: false, errors: [{ message: "HighPerformanceSchemaCompilerTool validate function is missing.", keyword: 'system' }] };
        }
        return SchemaCompilerTool.validate(schema, data);
    }
}

module.exports = SchemaValidator;
