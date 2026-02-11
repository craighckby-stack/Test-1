/**
 * SchemaValidator Utility Proxy
 * Delegates validation and compilation tasks to the HighPerformanceSchemaCompilerTool.
 * V97.1.0: Refactored to use dedicated Kernel Tool.
 */

const TOOL_NAME = "HighPerformanceSchemaCompilerTool";
const UNAVAILABLE_ERROR_MSG = `${TOOL_NAME} is unavailable.`;
const SYSTEM_ERROR_OBJ = {
    isValid: false,
    errors: [{ message: UNAVAILABLE_ERROR_MSG, keyword: 'system' }]
};

// Centralized fallback tool definition for graceful degradation
const FallbackTool = {
    compile: () => { 
        throw new Error(UNAVAILABLE_ERROR_MSG);
    },
    validate: () => SYSTEM_ERROR_OBJ
};

// Conceptual access to the kernel tool interface. 
// Resolves the actual tool or the robust FallbackTool.
const SchemaCompilerTool = globalThis.AGI_KERNEL_TOOLS?.[TOOL_NAME] || FallbackTool;

/**
 * Proxy class for Schema Validation operations.
 * Trusts the initialization setup (SchemaCompilerTool) handles availability errors.
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
        // No redundant check needed; FallbackTool.compile handles the error case via throw.
        return SchemaCompilerTool.compile(schema);
    }

    /**
     * Helper method to directly validate data against a raw schema.
     * Delegates to the HighPerformanceSchemaCompilerTool.
     * @param {object} schema - The JSON Schema definition.
     * @param {any} data - The data to validate.
     * @returns {{isValid: boolean, errors: Array<object>}} Validation result object.
     */
    validate(schema, data) {
        // No redundant check needed; FallbackTool.validate handles the error case by returning SYSTEM_ERROR_OBJ.
        return SchemaCompilerTool.validate(schema, data);
    }
}

module.exports = SchemaValidator;