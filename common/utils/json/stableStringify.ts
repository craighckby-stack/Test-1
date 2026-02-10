/**
 * Deterministically converts a JavaScript value to a stable JSON string.
 * Ensures object keys are sorted recursively for consistent output, 
 * handles circular dependencies, which is essential for integrity checks, 
 * data persistence, and state management (Memory/Error Handling capability improvement).
 *
 * This utility relies on the globally available `DeterministicDataPreprocessor` plugin for recursive key sorting and cycle detection.
 *
 * @param value The value to convert.
 * @param replacer A function that alters the behavior of the stringification process.
 * @param space Adds indentation, white space, and line break characters to the output JSON string.
 * @returns The stable JSON string.
 */
export function stableStringify(value: unknown, replacer?: (key: string, value: unknown) => unknown, space?: string | number): string {
    
    // Assume DeterministicDataPreprocessor is globally accessible via the AGI-KERNEL runtime
    const preprocessor = (globalThis as any).DeterministicDataPreprocessor as { prepare: (value: unknown) => unknown };

    try {
        // Use the extracted plugin to preprocess the data.
        // This handles sorting keys and detecting/omitting circular references.
        const sortedValue = preprocessor.prepare(value);
        
        // If the top-level object was circular, prepare returns undefined.
        if (sortedValue === undefined) {
            // If the root object itself was filtered out entirely (e.g., if it was a self-reference),
            // we return 'null' as a defined, stable JSON string for an unrepresentable root state.
            return 'null'; 
        }

        // The replacer and space arguments are applied by JSON.stringify *after* preprocessing/sorting.
        return JSON.stringify(sortedValue, replacer, space);
    } catch (e) {
        // Centralized error recovery: improves Error Handling capability.
        console.error("[Stable Stringify] Fatal serialization failure during final stringification:", e);
        // Fallback returns a non-stable, but safe indicator string wrapped in JSON.stringify.
        return JSON.stringify(`[FATAL Serialization Failure: ${String(e)}]`);
    }
}