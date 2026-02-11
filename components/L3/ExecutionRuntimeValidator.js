const VALIDATOR_TOOL_NAME = "RuntimeConstraintValidatorTool";

/**
 * Validates the local host environment against the strict resource constraints
 * defined in the SEM configuration prior to sandbox initialization.
 * 
 * Delegates actual resource checks (CPU, memory, accelerators) to the 
 * RuntimeConstraintValidatorTool via KERNEL_SYNERGY_CAPABILITIES.
 * 
 * @param {object} constraints - ExecutionEnvironmentConstraints from SEM_config
 * @returns {boolean} True if environment meets constraints.
 */
export function validateRuntime(constraints) {
    // Initialize KERNEL access safely to prevent ReferenceErrors
    const KERNEL = typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' ? KERNEL_SYNERGY_CAPABILITIES : {};
    const Tool = KERNEL.Tool;

    if (!Tool || typeof Tool.execute !== 'function') {
        console.error("CRITICAL ERROR: KERNEL_SYNERGY_CAPABILITIES.Tool interface is unavailable or improperly structured. Cannot delegate runtime validation.");
        return false;
    }

    try {
        const payload = {
            toolName: VALIDATOR_TOOL_NAME,
            method: 'validate',
            args: [constraints]
        };

        // Execute the validation via the registered tool interface
        const result = Tool.execute(payload);
        
        // Standardize result to a strict boolean, coercing truthy/falsy returns.
        return typeof result === 'boolean' ? result : !!result;
        
    } catch (e) {
        console.error(`Runtime constraint validation delegation failed for tool '${VALIDATOR_TOOL_NAME}': ${e.message}`, e);
        return false;
    }
}