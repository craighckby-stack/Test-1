/**
 * ACVD Schema Definitions (v1.1)
 * The structure definitions are now managed by the 'ACVDSchemaDefinitions' plugin,
 * centralizing governance policy structure and minimizing local dependencies.
 */

// Assume KERNEL_SYNERGY_CAPABILITIES is globally available.

/**
 * Validates a candidate ACVD object against the defined schema using the kernel's validation service.
 * @param {unknown} candidate - The object to validate.
 * @returns {unknown} The validated and parsed object (type inferred by runtime context).
 * @throws {Error} If validation fails (via the StructuralSchemaValidator).
 */
export function validateACVDStructure(candidate: unknown): unknown {
    // Load the ACVD schema definition from the dedicated plugin
    const { ACVDSchema } = KERNEL_SYNERGY_CAPABILITIES.Plugin.get("ACVDSchemaDefinitions");

    // Delegation to the kernel tool for standardized, high-performance validation.
    return KERNEL_SYNERGY_CAPABILITIES.Tool.execute({
        toolName: "StructuralSchemaValidator",
        method: "execute",
        args: {
            data: candidate,
            schemaReference: ACVDSchema // The Zod schema object retrieved from the plugin
        }
    });
}