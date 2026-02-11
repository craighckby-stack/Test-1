/**
 * APM_Canonizer: Canonical JSON Stringification Utility.
 * 
 * Ensures deterministic byte representation of the APM object for hashing and signing operations, 
 * thereby guaranteeing cryptographic integrity across disparate systems and languages.
 */

declare const CanonicalJsonStringifierTool: {
    execute(data: any): string;
};

// Assumed declaration/import from the generated Utf8Converter plugin
declare function stringToUint8Array(input: string): Uint8Array;

/**
 * Converts a data object into its canonical UTF-8 byte representation.
 * 
 * @param data The object to canonicalize.
 * @returns {Uint8Array} The deterministic UTF-8 byte array (Buffer in Node.js).
 */
export function canonicalizeAPM(data: any): Uint8Array {
    if (!CanonicalJsonStringifierTool) {
        throw new Error("Dependency error: CanonicalJsonStringifierTool is not available.");
    }
    
    // 1. Get the deterministic JSON string.
    const deterministicString = CanonicalJsonStringifierTool.execute(data);
    
    // 2. Convert string to UTF-8 bytes using the abstracted utility.
    return stringToUint8Array(deterministicString);
}