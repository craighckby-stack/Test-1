const GAXTelemetry = require('../Telemetry/GAXTelemetryService');

/**
 * CRoTIndexClient
 * Handles the low-level data interaction for the PolicyHeuristicIndex, abstracting 
 * access to the CRoT Key-Value persistence layer. It manages data retrieval 
 * (lookup of anchors) and persistence (commit indexing).
 * 
 * NOTE: The storage implementation (indexStore) must support the following methods:
 *   - lookup(key): async -> Promise<string[]>
 *   - append(key, value, metadata): async -> Promise<void>
 */
class CRoTIndexClient {
    
    /**
     * @param {object} storageHandle - The persistent storage layer handle, 
     *                                 expected to provide index operations (lookup, append).
     */
    constructor(storageHandle) {
        if (!storageHandle || typeof storageHandle.lookup !== 'function' || typeof storageHandle.append !== 'function') {
            GAXTelemetry.critical('CRoT_IndexClient_DependencyMissing', { detail: 'Valid storage handle required for index operations.' });
            throw new Error("CRoTIndexClient requires a valid storage handle supporting lookup and append.");
        }
        this.indexStore = storageHandle;
        GAXTelemetry.system('CRoT_IndexClient_Init');
    }

    /**
     * Retrieves historical ACV transaction IDs (anchors) associated with a policy fingerprint.
     * @param {string} fingerprint - SHA-256 policy structure hash.
     * @returns {Promise<string[]>} Array of ACV transaction IDs.
     */
    async getAnchorsByFingerprint(fingerprint) {
        if (!fingerprint) return [];
        try {
            // NOTE: Actual implementation involves querying the underlying KV store efficiently.
            const anchors = await this.indexStore.lookup(fingerprint);
            GAXTelemetry.debug('CRoT_IndexRead', { count: anchors.length, fingerprint: fingerprint.substring(0, 8) });
            return anchors;
        } catch (error) {
            GAXTelemetry.error('CRoT_IndexRead_Failure', { error: error.message, fingerprint: fingerprint ? fingerprint.substring(0, 8) : 'N/A' });
            return [];
        }
    }

    /**
     * Commits a new successful ACV transaction ID against the policy fingerprint key.
     * @param {string} fingerprint - The policy structure hash.
     * @param {string} txId - The successful ACV transaction ID.
     * @returns {Promise<void>}
     */
    async indexCommit(fingerprint, txId) {
        if (!fingerprint || !txId) {
            GAXTelemetry.warn('CRoT_IndexWrite_Skip', { reason: 'Missing identifier', hasFingerprint: !!fingerprint, hasTxId: !!txId });
            return;
        }
        try {
            // Append the new anchor (txId) to the index entry for the given fingerprint.
            await this.indexStore.append(fingerprint, txId, { timestamp: Date.now() });
            GAXTelemetry.info('CRoT_IndexWrite_Success', { txId, fingerprint: fingerprint.substring(0, 8) });
        } catch (error) {
            GAXTelemetry.critical('CRoT_IndexWrite_Failure', { txId, error: error.message, fingerprint: fingerprint.substring(0, 8) });
            throw new Error(`CRoT Indexing failed for TX ID ${txId}. Failure: ${error.message}`);
        }
    }
}

module.exports = CRoTIndexClient;