/**
 * AGI-KERNEL Schema Validator Proxy Kernel
 * Delegates high-integrity schema compilation and validation tasks 
 * to the specialized ISpecValidatorKernel.
 * 
 * Adheres to AIA Enforcement Layer mandates:
 * 1. Asynchronous initialization via initialize().
 * 2. Explicit dependency injection.
 * 3. Maximum Recursive Abstraction (MRA) by delegating core logic.
 */
class SchemaValidatorKernel {
    /**
     * @param {object} tools 
     * @param {ISpecValidatorKernel} tools.iSpecValidatorKernel
     */
    constructor({ iSpecValidatorKernel }) {
        if (!iSpecValidatorKernel) {
            throw new Error("[SchemaValidatorKernel] Initialization failure: ISpecValidatorKernel dependency is missing.");
        }
        /** @type {ISpecValidatorKernel} */
        this.specValidator = iSpecValidatorKernel;
    }

    /**
     * Initializes the kernel and ensures dependencies are ready.
     * This method is mandatory for AIA compliance.
     * @returns {Promise<void>}
     */
    async initialize() {
        // The underlying ISpecValidatorKernel handles its own complex asynchronous setup.
        return Promise.resolve();
    }

    /**
     * Compiles a JSON Schema into a reusable, high-performance validation function.
     * Delegates to the ISpecValidatorKernel.
     * 
     * NOTE: This proxy maintains a synchronous facade for high-performance usage 
     * post-initialization, relying on the underlying kernel's optimized runtime path.
     * 
     * @param {object} schema - The JSON Schema definition.
     * @returns {Function} The compiled validation function.
     * @throws {Error} If schema compilation fails.
     */
    compile(schema) {
        // Delegate compilation to the specialized tool kernel.
        return this.specValidator.compile(schema);
    }

    /**
     * Helper method to directly validate data against a raw schema.
     * Delegates to the ISpecValidatorKernel.
     * 
     * @param {object} schema - The JSON Schema definition.
     * @param {any} data - The data to validate.
     * @returns {{isValid: boolean, errors: Array<object>}} Validation result object.
     */
    validate(schema, data) {
        // Delegate direct validation to the specialized tool kernel.
        return this.specValidator.validate(schema, data);
    }
}

module.exports = SchemaValidatorKernel;