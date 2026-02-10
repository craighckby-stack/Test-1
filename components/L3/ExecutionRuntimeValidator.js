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
    if (typeof KERNEL_SYNERGY_CAPABILITIES === 'undefined' || !KERNEL_SYNERGY_CAPABILITIES.Tool) {
        console.error("CRITICAL ERROR: KERNEL_SYNERGY_CAPABILITIES.Tool is missing. Cannot perform runtime validation.");
        return false;
    }

    try {
        // Execute the 'validate' method on the registered tool
        const result = KERNEL_SYNERGY_CAPABILITIES.Tool.execute({
            toolName: VALIDATOR_TOOL_NAME,
            method: 'validate',
            args: [constraints]
        });
        
        // The tool should return a boolean result based on validation success.
        return typeof result === 'boolean' ? result : !!result;
        
    } catch (e) {
        console.error(`Validation failed due to tool execution error: ${e.message}`);
        return false;
    }
}