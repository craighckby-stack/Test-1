/**
 * Recursively sorts keys of an object to ensure deterministic stringification,
 * and handles circular references by omitting them.
 * 
 * @param obj The object or array to preprocess
 * @param cache A Set used to track objects already visited in the current descent path.
 * @returns A new object or array with sorted keys, or the original value if not an object, or `undefined` if a circular reference is detected and should be omitted.
 */
function preprocessSort(obj: unknown, cache: Set<unknown>): unknown {
    // Handles null, undefined, primitives (number, string, boolean)
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    // 1. Check for Circular Reference
    if (cache.has(obj)) {
        return undefined; // Indicates a circular reference; JSON.stringify will omit this value or it will be filtered from an array.
    }
    
    // 2. Track current object
    cache.add(obj);

    let result: unknown;

    if (Array.isArray(obj)) {
        // Array processing: Filter out undefined results from recursion (omitted circular references)
        result = obj
            .map(item => preprocessSort(item, cache))
            .filter(item => item !== undefined); 
    } else {
        // Object processing
        try {
            // Use property filtering to ensure we only deal with string keys suitable for JSON
            const keys = Object.keys(obj).sort(); 
            result = {};
        
            for (const key of keys) {
                // Assert obj[key] access is safe since key is from Object.keys(obj)
                const value = preprocessSort((obj as Record<string, unknown>)[key], cache); 
                // Only include non-undefined values (handles omitted circular references)
                if (value !== undefined) {
                    (result as Record<string, unknown>)[key] = value;
                }
            }
        } catch (e) {
            // Handle cases where Object.keys fails (e.g., non-standard objects, proxies)
            console.warn(`[Stable Stringify] Key sorting failed for object (Type: ${typeof obj}):`, e);
            result = obj; // Fallback
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
export function stableStringify(value: unknown, replacer?: (key: string, value: unknown) => unknown, space?: string | number): string {
    // Start recursion with a fresh Set for tracking cycles.
    const cache = new Set<unknown>(); 
    
    try {
        const sortedValue = preprocessSort(value, cache);
        
        // If the top-level object was circular, preprocessSort returns undefined.
        if (sortedValue === undefined) {
            // If the root object itself was a circular dependency or was filtered out entirely,
            // we return 'null' as a defined, stable JSON string for an unrepresentable root state.
            return 'null'; 
        }

        return JSON.stringify(sortedValue, replacer, space);
    } catch (e) {
        // Centralized error recovery: improves Error Handling capability.
        console.error("[Stable Stringify] Fatal serialization failure during final stringification:", e);
        // Fallback returns a non-stable, but safe indicator string wrapped in JSON.stringify.
        return JSON.stringify(`[FATAL Serialization Failure: ${String(e)}]`);
    }
}