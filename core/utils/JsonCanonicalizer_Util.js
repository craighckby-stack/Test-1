/**
 * AGI-KERNEL v7.9.2 - JsonCanonicalizer Utility
 * Purpose: Ensures a consistent, deterministic string representation of state objects
 * by delegating canonicalization and hashing to the CanonicalStateIntegrityTool plugin.
 */

// NOTE: This assumes the kernel environment provides synchronous access to the plugin functions
const CanonicalIntegrityTool = require('@agi-kernel/plugins/CanonicalStateIntegrityTool');

/**
 * Utility wrapper exposing core canonicalization and hashing functions 
 * from the underlying integrity tool.
 * 
 * @module JsonCanonicalizer_Util
 * @alias CanonicalIntegrityTool
 */
module.exports = {
    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * @param {*} data - The value to canonicalize (usually an object).
     * @returns {string} The canonical JSON string.
     */
    canonicalize: CanonicalIntegrityTool.canonicalize,
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * @param {*} data - The data or pre-canonicalized string.
     * @returns {string} The resulting SHA-256 hash (hex) or an error indicator string.
     */
    hash: CanonicalIntegrityTool.hash
};
