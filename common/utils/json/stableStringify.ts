/**
 * Recursively sorts keys of an object to ensure deterministic stringification,
 * and handles circular references by omitting them.
 * 
 * @param obj The object or array to preprocess
 * @param cache A Set used to track objects already visited in the current descent path.
 * @returns A new object or array with sorted keys, or the original value if not an object, or `undefined` if a circular reference is detected.
 */
function preprocessSort(obj: any, cache: Set<any>): any {
    // Handles null, undefined, primitives (number, string, boolean)
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // 1. Check for Circular Reference
    if (cache.has(obj)) {
        return undefined; // Indicates a circular reference; JSON.stringify will omit this value.
    }
    
    // 2. Track current object
    cache.add(obj);

    let result: any;

    if (Array.isArray(obj)) {
        // Array processing: Filter out undefined results from recursion (omitted circular references)
        result = obj
            .map(item => preprocessSort(item, cache))
            .filter(item => item !== undefined);
    } else {
        // Object processing
        try {
            const keys = Object.keys(obj).sort();
            result = {};
        
            for (const key of keys) {
                const value = preprocessSort(obj[key], cache);
                // Only include non-undefined values (handles omitted circular references)
                if (value !== undefined) {
                    result[key] = value;
                }
            }
        } catch (e) {
            // Handle cases where Object.keys fails (e.g., non-standard objects, proxies)
            console.warn("[Stable Stringify] Key sorting failed for object:", e);
            result = obj;
        }
    }
    
    // 4. Backtrack: Remove object from cache once all its children are processed.
    cache.delete(obj);

    return result;
}

/**
 * Deterministically converts a JavaScript value to a stable JSON string.
 * Ensures object keys are sorted recursively for consistent output, 
 * handles circular dependencies, which is essential for integrity checks, 
 * data persistence, and state management (Memory/Error Handling capability improvement).
 *
 * @param value The value to convert.
 * @param replacer A function that alters the behavior of the stringification process (applied after sorting).
 * @param space Adds indentation, white space, and line break characters to the output JSON string.
 * @returns The stable JSON string.
 */
export function stableStringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string {
    // Start recursion with a fresh Set for tracking cycles.
    const cache = new Set(); 
    
    try {
        const sortedValue = preprocessSort(value, cache);
        
        // If the top-level object was circular (e.g., value = {a: value}), preprocessSort returns undefined.
        if (sortedValue === undefined) {
            return '""'; // Return a consistent empty JSON string representation if the root is a cycle.
        }

        return JSON.stringify(sortedValue, replacer, space);
    } catch (e) {
        console.error("[Stable Stringify] Fatal serialization failure during final stringification:", e);
        // Fallback returns a non-stable, but safe indicator string.
        return `"[FATAL Serialization Failure: ${String(e)}]"`;
    }
}