/**
 * Defines the standard cryptographic algorithm used for ACVD integrity checks.
 * Must be compatible with Node's crypto module.
 */
export const ALGORITHM = 'sha256';

/**
 * Interface definition stub for the required Canonical Serializer functionality.
 * The actual implementation is provided by the kernel's plugin system via dependency injection.
 */
interface ICanonicalSerializer {
    stringify(obj: object): string;
}

/**
 * Runtime reference to the injected Canonical Serializer utility.
 * This global hook is resolved by the kernel loader to an instance of ICanonicalSerializer.
 */
declare const SYSTEM_SERIALIZER: ICanonicalSerializer;

/**
 * Recursively sorts keys of an object to ensure deterministic output for hashing
 * using the kernel's dedicated Canonical Serialization Plugin.
 * @param obj The object to canonicalize.
 * @returns A strictly canonicalized JSON string.
 */
export function canonicalStringify(obj: object): string {
    // Utilize the injected plugin interface method for clean abstraction
    return SYSTEM_SERIALIZER.stringify(obj);
}