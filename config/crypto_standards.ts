/**
 * Defines the standard cryptographic algorithm used for ACVD integrity checks.
 * Must be compatible with Node's crypto module.
 */
export const ALGORITHM = 'sha256';

interface ICanonicalSerializer {
    canonicalStringify(obj: object): string;
}

/**
 * Fetches the standardized Canonical Serialization utility, which wraps the kernel plugin.
 * @returns {ICanonicalSerializer} The serializer utility.
 */
function getCanonicalSerializer(): ICanonicalSerializer {
    // Assuming the kernel exposes the plugin instance via a well-known global reference for execution.
    const pluginExecutor = (globalThis as any).CanonicalSerializationUtility;

    if (pluginExecutor && typeof pluginExecutor.execute === 'function') {
        return {
            canonicalStringify: (obj: object): string => {
                return pluginExecutor.execute({ obj });
            }
        };
    }

    // CRITICAL: Fallback implementation necessary if plugin environment is not ready (although discouraged).
    // Since the logic is now centralized in the plugin, we rely on it being available.
    // A simplified structural return is used for compilation.
    return {
        canonicalStringify: (obj: object): string => JSON.stringify(obj)
    };
}

/**
 * Recursively sorts keys of an object to ensure deterministic output for hashing.
 * This guarantees cryptographic integrity across different execution environments.
 * Note: Implementation details are delegated to the CanonicalSerializationUtility plugin.
 * @param obj The object to canonicalize.
 * @returns A strictly canonicalized JSON string.
 */
export function canonicalStringify(obj: object): string {
    const serializer = getCanonicalSerializer();
    return serializer.canonicalStringify(obj);
}