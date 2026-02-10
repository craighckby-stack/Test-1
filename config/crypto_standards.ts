/**
 * Defines the standard cryptographic algorithm used for ACVD integrity checks.
 * Must be compatible with Node's crypto module.
 */
export const ALGORITHM = 'sha256';

/**
 * Recursively sorts keys of an object to ensure deterministic output for hashing
 * using the kernel's dedicated Canonical Serialization Tool.
 * @param obj The object to canonicalize.
 * @returns A strictly canonicalized JSON string.
 */
export function canonicalStringify(obj: object): string {
    // The tool name is 'CanonicalSerializer', and it expects an object { obj: object }
    // and returns the canonical stringified JSON.
    const result = KERNEL_SYNERGY_CAPABILITIES.Tool.execute('CanonicalSerializer', { obj });

    // The result is expected to be the stringified JSON output.
    if (typeof result !== 'string') {
        throw new Error("CanonicalSerializer tool returned non-string result.");
    }
    
    return result;
}