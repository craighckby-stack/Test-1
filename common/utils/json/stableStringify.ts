/**
 * stableStringify.ts
 *
 * Provides a deterministic, byte-for-byte consistent JSON string representation.
 * Used primarily for cryptographic signing/hashing where key order must be preserved and standardized.
 */

/**
 * Recursively traverses and sorts keys within objects to prepare them for deterministic stringification.
 * @param obj The object or array to process.
 * @returns A structurally identical object/array where all nested object keys are lexically sorted.
 */
const preprocessSort = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(preprocessSort);
    }
    
    // Handle objects and ensure recursive sorting
    if (typeof obj === 'object' && obj !== null) {
        const sortedKeys = Object.keys(obj).sort();
        const sortedObject: { [key: string]: any } = {};
        
        for (const key of sortedKeys) {
            // Recursively process the value
            sortedObject[key] = preprocessSort(obj[key]);
        }
        return sortedObject;
    }
    
    // Primitives
    return obj;
};

/**
 * Stringifies an object into a canonical JSON string (sorted keys, minimal whitespace).
 * @param data The input object.
 * @returns The canonical JSON string representation.
 */
export function stableStringify(data: any): string {
    const preprocessedData = preprocessSort(data);
    
    // JSON.stringify handles formatting with minimal whitespace when no spacer argument is provided.
    return JSON.stringify(preprocessedData);
}