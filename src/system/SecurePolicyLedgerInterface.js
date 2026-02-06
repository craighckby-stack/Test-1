const IntegrityUtils = require('./IntegrityUtils');

/**
 * Interface Component: SecurePolicyLedgerInterface (D-01 Connector) v94.1
 * Role: Provides secured read/write access to the cryptographic integrity ledger (D-01).
 * Mandate: Acts as the dedicated channel for retrieving baseline configuration hashes and 
 *          persisting authorized updates, ensuring strong cryptographic authentication 
 *          and boundary enforcement. CIM relies on this for policy I/O.
 */
class SecurePolicyLedgerInterface {
    
    // Private field for securing the RPC client reference.
    #rpcClient;

    /**
     * @param {object} rpcClient - The secure client used for Ledger (D-01) interaction.
     */
    constructor(rpcClient) {
        if (!rpcClient || typeof rpcClient.call !== 'function') {
            throw new Error("[SecurePolicyLedgerInterface]: Requires a secured RPC client with a callable method.");
        }
        this.#rpcClient = rpcClient; 
    }

    /**
     * Retrieves the map of known-good hashes for a list of configured file paths.
     * This interaction must be cryptographically verified against D-01.
     * @param {string[]} paths - List of paths to query hashes for.
     * @returns {Promise<Object<string, string>>} Hash map (path -> hash).
     */
    async getPolicyHashes(paths) {
        if (!Array.isArray(paths) || paths.some(p => typeof p !== 'string')) {
            throw new TypeError("Input paths must be an array of strings.");
        }
        
        try {
            // console.debug(`[SPLI] Requesting hashes for ${paths.length} paths.`); // Use logging if available
            const result = await this.#rpcClient.call('D01.fetch_hashes', { paths });
            
            // Critical Integrity Check: Validate the structure of the returned hashes using the new utility.
            if (!IntegrityUtils.isValidPolicyHashMap(result)) {
                 throw new Error("Ledger returned a response that failed policy hash map integrity validation.");
            }
            
            return result;
        } catch (error) {
            // console.error(`[SPLI] Failed access D-01 for hash retrieval: ${error.message}`); // Use logging if available
            // Re-throw standardized error format
            throw new Error(`Integrity Ledger access failure during retrieval: ${error.message}`);
        }
    }

    /**
     * Persists a newly approved hash for a file path. Must only succeed post A-01 approval.
     * This operation must be transactionally signed and immutable in D-01.
     * @param {string} filePath - Path of the file updated.
     * @param {string} newHash - The SHA-512 digest approved by the Governance module.
     * @returns {Promise<boolean>} Success status.
     */
    async storeNewIntegrityHash(filePath, newHash) {
        if (typeof filePath !== 'string' || filePath.length === 0) {
            throw new TypeError("File path must be a non-empty string.");
        }
        
        // Use dedicated utility for cryptographic standard enforcement
        if (!IntegrityUtils.isValidPolicyHash(newHash)) {
            throw new TypeError("Provided hash does not meet expected system integrity standard (e.g., SHA-512 format).");
        }

        try {
            const result = await this.#rpcClient.call('D01.store_hash_record', { filePath, newHash });
            
            // Normalize D-01 response (assuming 'true' or { success: true } means success)
            if (result === true || (typeof result === 'object' && result?.success === true)) {
                return true;
            }
            
            // Explicit failure notification from D-01
            const errorMessage = (typeof result === 'object' && result?.message) || 'Ledger indicated non-specific operational failure.';
            throw new Error(errorMessage);

        } catch (error) {
            // console.error(`[SPLI] Failed access D-01 for hash persistence: ${error.message}`); // Use logging if available
            throw new Error(`Integrity Ledger access failure during storage: ${error.message}`);
        }
    }
}

module.exports = SecurePolicyLedgerInterface;