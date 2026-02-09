/**
 * AGI-KERNEL v7.4.3 - JsonCanonicalizer Utility
 * Purpose: Ensures a consistent, deterministic string representation of state objects
 * suitable for persistent storage (Nexus-Database) and integrity checks.
 *
 * Improvement: Enhanced error handling for robust operation, particularly against
 * circular references during state snapshotting.
 */
const crypto = require('crypto');

class JsonCanonicalizer_Util {
    
    /**
     * Recursively sorts keys within an object to ensure deterministic JSON serialization.
     * Implements circular reference detection to prevent recursion errors and crashes.
     * @param {*} obj - The value to sort (Object, Array, or Scalar).
     * @param {Set} seen - Internal set used for tracking circular references.
     * @returns {*} The deeply sorted structure or original scalar.
     */
    static _deepSortKeys(obj, seen = new Set()) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        // 1. Circular Reference Check
        if (seen.has(obj)) {
            // Use a safe string representation for circular references
            return '[Circular Reference Detected]';
        }
        seen.add(obj);

        if (Array.isArray(obj)) {
            const result = obj.slice().map(item => JsonCanonicalizer_Util._deepSortKeys(item, seen));
            seen.delete(obj);
            return result;
        }
        
        // 2. Handle standard objects
        try {
            const sortedKeys = Object.keys(obj).sort();
            const newObj = {};
            for (const key of sortedKeys) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    newObj[key] = JsonCanonicalizer_Util._deepSortKeys(obj[key], seen);
                }
            }
            seen.delete(obj);
            return newObj;
        } catch (e) {
             // General object processing error handling
             return `[Error processing object: ${e.message}]`;
        }
    }

    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * @param {Object} data - The object to canonicalize.
     * @returns {string} The canonical JSON string.
     */
    static canonicalize(data) {
        if (data === undefined) return '{}';
        try {
            const sortedData = JsonCanonicalizer_Util._deepSortKeys(data);
            // Canonical format: Strict JSON, no spacing, ordered keys.
            return JSON.stringify(sortedData);
        } catch (e) {
            console.error("Canonicalization Error: Failed to stringify data.", e);
            // Graceful failure: Return an error-indicated canonical string
            return JSON.stringify({ error: "Canonicalization_Failure", message: e.message });
        }
    }
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * @param {string} canonicalString - The canonical JSON string.
     * @returns {string} The resulting SHA-256 hash (hex).
     */
    static hash(canonicalString) {
        if (typeof canonicalString !== 'string') {
            throw new Error("Input to hash must be a canonical string.");
        }
        try {
            return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
        } catch (e) {
            console.error("Hashing Error:", e);
            return 'HASHING_FAILED';
        }
    }
}

module.exports = JsonCanonicalizer_Util;