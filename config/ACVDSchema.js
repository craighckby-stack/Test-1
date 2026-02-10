/**
 * ACVD Schema Definitions (v1.1)
 * Provides centralized access to the ACVD validation policy via the ACVDValidator plugin.
 */

// Assume KERNEL_SYNERGY_CAPABILITIES is globally available.

/**
 * Validates a candidate ACVD object against the defined schema using the kernel's validation service.
 * @param {unknown} candidate - The object to validate.
 * @returns {unknown} The validated and parsed object (type inferred by runtime context).
 * @throws {Error} If validation fails (via the ACVDValidator plugin).
 */
export function validateACVDStructure(candidate: unknown): unknown {
    // Delegation to the dedicated ACVDValidator plugin.
    // This abstracts the schema retrieval and tool execution details.
    const validator = KERNEL_SYNERGY_CAPABILITIES.Plugin.get("ACVDValidator");

    if (!validator || typeof validator.validate !== 'function') {
        throw new Error("ACVDValidator plugin is not correctly initialized or available.");
    }

    return validator.validate(candidate);
}