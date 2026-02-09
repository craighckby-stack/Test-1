/**
 * Recursively sorts keys of an object to ensure deterministic stringification.
 * Required for cryptographic hashing and consistent storage state.
 * @param obj The object or array to preprocess
 * @returns A new object or array with sorted keys, or the original value if not an object.
 */
function preprocessSort(obj: any): any {
    // Handles null, undefined, primitives (number, string, boolean)
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        // Recursively preprocess array elements
        return obj.map(preprocessSort);
    }

    // Handle plain objects
    try {
        const keys = Object.keys(obj).sort();
        const sorted: { [key: string]: any } = {};
    
        for (const key of keys) {
            sorted[key] = preprocessSort(obj[key]);
        }
    
        return sorted;
    } catch (e) {
        // Error handling for objects that might fail Object.keys (e.g., sealed/frozen prototypes in some environments)
        console.error("Key sorting failed during preprocessing:", e);
        return obj; // Return original object if preprocessing fails
    }
}

/**
 * Deterministically converts a JavaScript value to a stable JSON string.
 * Ensures object keys are sorted recursively for consistent output, 
 * which is essential for integrity checks, data persistence, and state management.
 *
 * @param value The value to convert.
 * @param replacer A function that alters the behavior of the stringification process.
 * @param space Adds indentation, white space, and line break characters to the output JSON string.
 * @returns The stable JSON string.
 */
export function stableStringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string {
    try {
        const sortedValue = preprocessSort(value);
        return JSON.stringify(sortedValue, replacer, space);
    } catch (e) {
        // Robust error handling for non-serializable types or circular dependencies
        console.warn("Stable stringify detected serialization error:", e);
        // Attempt standard JSON.stringify as a fallback, potentially losing stability guarantees
        try {
            return JSON.stringify(value);
        } catch (fallbackError) {
            // If even fallback fails, return a safe string indicator
            return `"[Serialization Failure: ${String(fallbackError)}]"`;
        }
    }
}