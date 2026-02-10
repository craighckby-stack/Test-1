/**
 * AGI-KERNEL v7.8.0 - JsonCanonicalizer Utility
 * Purpose: Ensures a consistent, deterministic string representation of state objects
 * by delegating canonicalization and hashing to the CanonicalStateIntegrityTool plugin.
 */

// NOTE: This assumes the kernel environment provides synchronous access to the plugin functions
// via a standard module loader (or DI system) under the assumed name.
const CanonicalIntegrityTool = require('@agi-kernel/plugins/CanonicalStateIntegrityTool');

class JsonCanonicalizer_Util {
    
    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * @param {*} data - The value to canonicalize (usually an object).
     * @returns {string} The canonical JSON string.
     */
    static canonicalize(data) {
        return CanonicalIntegrityTool.canonicalize(data);
    }
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * @param {*} data - The data or pre-canonicalized string.
     * @returns {string} The resulting SHA-256 hash (hex) or an error indicator string.
     */
    static hash(data) {
        return CanonicalIntegrityTool.hash(data);
    }
}

module.exports = JsonCanonicalizer_Util;