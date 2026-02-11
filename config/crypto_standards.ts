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
 * Resolve the SYSTEM_SERIALIZER reference locally upon module initialization.
 * This strategy centralizes the dependency linkage, improving encapsulation 
 * and ensuring a direct, locally-scoped reference is used for high-frequency operations.
 */
const ACVD_SERIALIZER = SYSTEM_SERIALIZER;

/**
 * Executes the core canonical serialization via the kernel's injected utility.
 * This helper function enforces architectural consistency by separating the direct 
 * dependency interaction (I/O proxy) from the primary exported interface.
 * @param obj The object to serialize.
 * @returns A strictly canonicalized JSON string.
 */
function _performSerialization(obj: object): string {
    return ACVD_SERIALIZER.stringify(obj);
}

/**
 * Provides a standardized, deterministic string representation of an object 
 * required for cryptographic integrity checks (ACVD), leveraging the kernel's 
 * dedicated Canonical Serialization Plugin.
 * @param obj The object to canonicalize.
 * @returns A strictly canonicalized JSON string.
 */
export function canonicalStringify(obj: object): string {
    // Delegate the actual serialization task to the internal execution utility.
    return _performSerialization(obj);
}