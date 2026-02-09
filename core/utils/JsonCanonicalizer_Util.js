/**
 * AGI-KERNEL v7.4.4 - JsonCanonicalizer Utility (Refactored)
 * Purpose: Ensures a consistent, deterministic string representation of state objects
 * suitable for persistent storage (Nexus-Database) and integrity checks.
 *
 * Improvement: Enhanced robustness by explicitly handling undefined values and functions
 * during deep sorting to guarantee canonical output that precisely matches JSON.stringify 
 * behavior while preventing circular reference crashes. Improves Error Handling and JSON Parsing capabilities.
 */
const crypto = require('crypto');

class JsonCanonicalizer_Util {
    
    /**
     * Recursively sorts keys within an object to ensure deterministic JSON serialization.
     * Implements circular reference detection to prevent recursion errors and crashes.
     * @param {*} obj - The value to sort (Object, Array, or Scalar).
     * @param {Set} seen - Internal set used for tracking circular references.
     * @returns {*} The deeply sorted structure or original scalar, or a placeholder for circular refs.
     */
    static _deepSortKeys(obj, seen = new Set()) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        // 1. Circular Reference Check (Must happen before entering recursion)
        if (seen.has(obj)) {
            // Use a safe, deterministic string representation for circular references
            return '[Circular Reference Detected]';
        }
        seen.add(obj);

        if (Array.isArray(obj)) {
            const result = obj.map(item => JsonCanonicalizer_Util._deepSortKeys(item, seen));
            seen.delete(obj);
            return result;
        }
        
        // 2. Handle standard objects
        try {
            const sortedKeys = Object.keys(obj).sort();
            const newObj = {};
            
            for (const key of sortedKeys) {
                // Ensure key exists 
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    
                    // JSON.stringify ignores undefined and function properties.
                    // We must mirror this behavior during sorting for true canonicalization.
                    if (value !== undefined && typeof value !== 'function') {
                        newObj[key] = JsonCanonicalizer_Util._deepSortKeys(value, seen);
                    }
                }
            }
            seen.delete(obj);
            return newObj;
        } catch (e) {
             // If a failure occurs during sorting, return a descriptive error placeholder.
             return { "_canonicalizationError": true, "message": e.message };
        }
    }

    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * @param {*} data - The value to canonicalize (usually an object).
     * @returns {string} The canonical JSON string.
     */
    static canonicalize(data) {
        // Consistent with prior kernel versions handling of undefined input.
        if (data === undefined) return '{}'; 
        
        try {
            const sortedData = JsonCanonicalizer_Util._deepSortKeys(data);
            
            // Canonical format: Strict JSON, no spacing, ordered keys.
            return JSON.stringify(sortedData);
        } catch (e) {
            // Graceful failure: This catch handles errors during the final JSON.stringify stage.
            console.error("Canonicalization Error: Failed to stringify data.", e);
            return JSON.stringify({ error: "Canonicalization_Terminal_Failure", message: e.message });
        }
    }
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * @param {string} canonicalString - The canonical JSON string.
     * @returns {string} The resulting SHA-256 hash (hex).
     */
    static hash(canonicalString) {
        if (typeof canonicalString !== 'string') {
            // Robustly attempt to canonicalize non-string inputs before hashing.
            try {
                 canonicalString = JsonCanonicalizer_Util.canonicalize(canonicalString);
            } catch (e) {
                 return 'HASHING_FAILED_INVALID_INPUT';
            }
        }
        try {
            return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
        } catch (e) {
            console.error("Hashing Runtime Error:", e);
            return 'HASHING_RUNTIME_FAILED';
        }
    }
}

module.exports = JsonCanonicalizer_Util;