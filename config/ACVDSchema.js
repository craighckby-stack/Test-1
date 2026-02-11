/**
 * ACVD Schema Definitions (v1.1)
 * Provides centralized access to the ACVD validation policy via the ACVDValidator plugin.
 *
 * This module now leverages the KernelCapabilityInvoker for standardized, robust plugin execution.
 */

// Assume KERNEL_SYNERGY_CAPABILITIES is globally available.

/**
 * Validates a candidate ACVD object against the defined schema using the kernel's validation service.
 * @param {unknown} candidate - The object to validate.
 * @returns {unknown} The validated and parsed object (type inferred by runtime context).
 * @throws {Error} If validation fails or if required plugins are missing.
 */
export function validateACVDStructure(candidate: unknown): unknown {
    // Retrieve the generalized plugin execution utility.
    const invoker = KERNEL_SYNERGY_CAPABILITIES.Plugin.get("KernelCapabilityInvoker");

    if (!invoker || typeof invoker.execute !== 'function') {
        throw new Error("Core execution invoker (KernelCapabilityInvoker) is not available. System integrity compromised.");
    }

    // Delegate execution: The Invoker handles plugin lookup, interface checks, and execution.
    // This drastically reduces boilerplate and centralizes error handling.
    return invoker.execute("ACVDValidator", "validate", candidate);
}