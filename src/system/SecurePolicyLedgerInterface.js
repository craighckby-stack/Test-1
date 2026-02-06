const IntegrityUtils = require('./IntegrityUtils');

// Define specific error context constants
const ERROR_PREFIX = "[SecurePolicyLedgerInterface]";

/**
 * Interface Component: SecurePolicyLedgerInterface (D-01 Connector) v94.1
 * Role: Provides secured read/write access to the cryptographic integrity ledger (D-01).
 * Mandate: Acts as the dedicated channel for retrieving baseline configuration hashes and 
 *          persisting authorized updates, ensuring strong cryptographic authentication 
 *          and boundary enforcement. CIM relies on this for policy I/O.
 */
class SecurePolicyLedgerInterface {
    
    // RPC Method Constants defined as static properties for easy access and configuration
    static RPC_METHODS = {
        FETCH_HASHES: 'D01.fetch_hashes',
        STORE_HASH_RECORD: 'D01.store_hash_record'
    };

    #rpcClient;
    #logger;

    /**
     * @param {object} rpcClient - The secure client used for Ledger (D-01) interaction.
     * @param {object} logger - The system logging utility (must support .error, .debug).
     */
    constructor(rpcClient, logger) {
        if (!rpcClient || typeof rpcClient.call !== 'function') {
            throw new Error(`${ERROR_PREFIX}: Requires a secured RPC client with a callable method.`);
        }
        // Enforce logger dependency for critical system components
        if (!logger || typeof logger.error !== 'function') {
             throw new Error(`${ERROR_PREFIX}: Requires a valid logging utility.`);
        }

        this.#rpcClient = rpcClient; 
        this.#logger = logger;
        this.#logger.debug(`${ERROR_PREFIX}: Initialized successfully.`);
    }

    /**
     * Retrieves the map of known-good hashes for a list of configured file paths.
     * This interaction must be cryptographically verified against D-01.
     * @param {string[]} paths - List of paths to query hashes for.
     * @returns {Promise<Object<string, string>>} Hash map (path -> hash).
     */
    async getPolicyHashes(paths) {
        if (!Array.isArray(paths) || paths.some(p => typeof p !== 'string')) {
            throw new TypeError(`${ERROR_PREFIX}: Input paths must be an array of strings.`);
        }
        
        try {
            this.#logger.debug(`[D-01] Requesting hashes for ${paths.length} paths.`, { paths });
            
            const result = await this.#rpcClient.call(SecurePolicyLedgerInterface.RPC_METHODS.FETCH_HASHES, { paths });
            
            // Critical Integrity Check: Validate the structure of the returned hashes.
            if (!IntegrityUtils.isValidPolicyHashMap(result)) {
                 const validationError = "Ledger response failed policy hash map integrity validation.";
                 this.#logger.error(`${ERROR_PREFIX}: ${validationError}`, { response: result });
                 throw new Error(validationError);
            }
            
            return result;
        } catch (error) {
            // Log failure with context before re-throwing
            this.#logger.error(`${ERROR_PREFIX}: Integrity Ledger access failure during retrieval.`, { error: error.message, method: SecurePolicyLedgerInterface.RPC_METHODS.FETCH_HASHES });
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
            throw new TypeError(`${ERROR_PREFIX}: File path must be a non-empty string.`);
        }
        
        // Use dedicated utility for cryptographic standard enforcement
        if (!IntegrityUtils.isValidPolicyHash(newHash)) {
            throw new TypeError(`${ERROR_PREFIX}: Provided hash does not meet expected system integrity standard.`);
        }

        try {
            this.#logger.debug(`[D-01] Attempting to store new hash for path: ${filePath}`);

            const result = await this.#rpcClient.call(
                SecurePolicyLedgerInterface.RPC_METHODS.STORE_HASH_RECORD, 
                { filePath, newHash }
            );
            
            // Normalize D-01 response (assuming 'true' or { success: true } means success)
            if (result === true || (typeof result === 'object' && result?.success === true)) {
                this.#logger.debug(`[D-01] Successfully stored hash for: ${filePath}`);
                return true;
            }
            
            // Explicit failure notification from D-01
            const errorMessage = (typeof result === 'object' && result?.message) || 'Ledger indicated non-specific operational failure.';
            this.#logger.error(`${ERROR_PREFIX}: D-01 storage failed.`, { filePath, response: result });
            throw new Error(errorMessage);

        } catch (error) {
            this.#logger.error(`${ERROR_PREFIX}: Integrity Ledger access failure during storage.`, { error: error.message, method: SecurePolicyLedgerInterface.RPC_METHODS.STORE_HASH_RECORD });
            throw new Error(`Integrity Ledger access failure during storage: ${error.message}`);
        }
    }
}

module.exports = SecurePolicyLedgerInterface;