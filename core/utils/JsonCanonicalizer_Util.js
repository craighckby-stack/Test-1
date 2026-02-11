/**
 * AGI-KERNEL v7.11.3 - JsonCanonicalizer Utility
 * Purpose: Ensures a consistent, deterministic string representation of state objects
 * by delegating canonicalization and hashing to the CanonicalStateIntegrityTool plugin.
 */

const CanonicalStateIntegrityTool = require('@agi-kernel/plugins/CanonicalStateIntegrityTool');

/**
 * Utility wrapper exposing core canonicalization and hashing functions 
 * from the underlying integrity tool via architectural I/O proxies.
 * 
 * @module JsonCanonicalizer_Util
 */
class JsonCanonicalizerUtility {

    /**
     * Isolates the direct interaction with the external dependency (Tool.canonicalize)
     * into a dedicated private static I/O proxy function.
     * @param {*} data - The value to canonicalize.
     * @returns {string} The canonical JSON string.
     */
    static #delegateToCanonicalizeTool(data) {
        // Enforcing architectural separation between core utility orchestration and external tool delegation.
        return CanonicalStateIntegrityTool.canonicalize(data);
    }

    /**
     * Isolates the direct interaction with the external dependency (Tool.hash)
     * into a dedicated private static I/O proxy function.
     * @param {*} data - The data or pre-canonicalized string.
     * @returns {string} The resulting SHA-256 hash (hex).
     */
    static #delegateToHashTool(data) {
        // Enforcing architectural separation between core utility orchestration and external tool delegation.
        return CanonicalStateIntegrityTool.hash(data);
    }

    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * @param {*} data - The value to canonicalize (usually an object).
     * @returns {string} The canonical JSON string.
     */
    static canonicalize(data) {
        return JsonCanonicalizerUtility.#delegateToCanonicalizeTool(data);
    }
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * @param {*} data - The data or pre-canonicalized string.
     * @returns {string} The resulting SHA-256 hash (hex).
     */
    static hash(data) {
        return JsonCanonicalizerUtility.#delegateToHashTool(data);
    }
}

module.exports = JsonCanonicalizerUtility;