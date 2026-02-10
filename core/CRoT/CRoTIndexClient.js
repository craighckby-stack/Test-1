const GAXTelemetry = require('../Telemetry/GAXTelemetryService');

/**
 * CRoTIndexClient
 * Handles the high-level policy data interaction, relying on the 
 * CRoTIndexStorageAdapter (abstracted KERNEL capability) for data access.
 */
class CRoTIndexClient {
    
    /**
     * The client now depends on the abstracted CRoTIndexStorageAdapter interface,
     * removing direct reliance on KERNEL_SYNERGY_CAPABILITIES.Tool.
     */
    constructor() {
        // Link to the required abstraction provided by the environment/plugin system
        this.storageAdapter = global.CRoTIndexStorageAdapter; // Assumes KERNEL environment linkage
        if (!this.storageAdapter) {
            // Provides clear failure if the KERNEL environment hasn't linked the adapter yet
            throw new Error("CRoT Index Client failed initialization: CRoTIndexStorageAdapter is missing.");
        }
        GAXTelemetry.system('CRoT_IndexClient_Init_KernelMode_Abstracted');
    }

    /**
     * Retrieves historical ACV transaction IDs (anchors) associated with a policy fingerprint.
     * @param {string} fingerprint - SHA-256 policy structure hash.
     * @returns {Promise<string[]>} Array of ACV transaction IDs.
     */
    async getAnchorsByFingerprint(fingerprint) {
        if (!fingerprint) return [];
        try {
            // Use abstracted storage adapter lookup method
            const anchors = await this.storageAdapter.lookup(fingerprint);
            
            // Ensure anchors is an array for safety
            const result = Array.isArray(anchors) ? anchors : (anchors ? [anchors] : []);
            
            GAXTelemetry.debug('CRoT_IndexRead', { count: result.length, fingerprint: fingerprint.substring(0, 8) });
            return result;
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
            // Use abstracted storage adapter append method
            await this.storageAdapter.append(fingerprint, txId, { timestamp: Date.now() });
            
            GAXTelemetry.info('CRoT_IndexWrite_Success', { txId, fingerprint: fingerprint.substring(0, 8) });
        } catch (error) {
            GAXTelemetry.critical('CRoT_IndexWrite_Failure', { txId, error: error.message, fingerprint: fingerprint.substring(0, 8) });
            throw new Error(`CRoT Indexing failed for TX ID ${txId}. Failure: ${error.message}`);
        }
    }
}

module.exports = CRoTIndexClient;