/**
 * AGI-KERNEL v7.4.4 - JsonCanonicalizer Utility
 * Purpose: Ensures a consistent, deterministic string representation of state objects
 * suitable for persistent storage (Nexus-Database) and integrity checks.
 *
 * Improvement Summary (Cycle 1): Enhanced Error Handling and Autonomy by generalizing 
 * the 'hash' function to accept any data structure directly, making it the primary
 * entry point for state integrity checks, and refining internal logic robustness 
 * against canonicalization errors.
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
        // Scalar and null check
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        // 1. Circular Reference Check 
        if (seen.has(obj)) {
            // Return deterministic string representation for circular references
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
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    
                    // Mirror JSON.stringify: ignore undefined and function properties.
                    if (value !== undefined && typeof value !== 'function') {
                        newObj[key] = JsonCanonicalizer_Util._deepSortKeys(value, seen);
                    }
                }
            }
            seen.delete(obj);
            return newObj;
        } catch (e) {
             // If a failure occurs during sorting (e.g., inaccessible property), return a descriptive error placeholder.
             // This maintains JSON parsing integrity within the larger structure.
             return { "_canonicalizationError": true, "message": e.message };
        }
    }

    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * Returns a string representation of an error object if final JSON serialization fails.
     * @param {*} data - The value to canonicalize (usually an object).
     * @returns {string} The canonical JSON string. Returns '{}' if input is undefined.
     */
    static canonicalize(data) {
        // Robust handling for persistence: undefined input maps to empty object state.
        if (data === undefined) return '{}'; 
        
        try {
            const sortedData = JsonCanonicalizer_Util._deepSortKeys(data);
            
            // Canonical format: Strict JSON, no spacing, ordered keys.
            return JSON.stringify(sortedData);
        } catch (e) {
            // Graceful failure: This catch handles errors during the final JSON.stringify stage.
            // This output signals a canonicalization failure but remains a valid, deterministic JSON string.
            console.error("Canonicalization Error: Failed to stringify data.", e);
            return JSON.stringify({ error: "Canonicalization_Terminal_Failure", message: e.message, data_type: typeof data });
        }
    }
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * Accepts either a canonical JSON string or a data object/structure, which is canonicalized first.
     * @param {*} data - The data or pre-canonicalized string.
     * @returns {string} The resulting SHA-256 hash (hex) or an error indicator string.
     */
    static hash(data) {
        let canonicalString;
        
        if (typeof data === 'string') {
            canonicalString = data;
        } else {
            // Leverage the primary canonicalize function for non-string data
            canonicalString = JsonCanonicalizer_Util.canonicalize(data);
        }
        
        // Check if canonicalization failed and returned a standardized error string
        if (typeof canonicalString !== 'string' || canonicalString.includes("Canonicalization_Terminal_Failure")) {
             // If canonicalize failed, return a specific error code for traceability
             return 'HASHING_FAILED_PREP';
        }

        try {
            // Perform hashing on the confirmed canonical string
            return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
        } catch (e) {
            console.error("Hashing Runtime Error:", e);
            return 'HASHING_RUNTIME_FAILED';
        }
    }
}

module.exports = JsonCanonicalizer_Util;