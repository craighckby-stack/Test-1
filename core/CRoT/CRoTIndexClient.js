const GAXTelemetry = require('../Telemetry/GAXTelemetryService');

/**
 * CRoTIndexClient
 * Handles the low-level data interaction for the PolicyHeuristicIndex, abstracting 
 * access via the KERNEL's CRoTIndexStorage capability.
 */
class CRoTIndexClient {
    
    /**
     * Constructor no longer requires a storageHandle dependency, relying on the KERNEL Tool.
     */
    constructor() {
        GAXTelemetry.system('CRoT_IndexClient_Init_KernelMode');
    }

    /**
     * Retrieves historical ACV transaction IDs (anchors) associated with a policy fingerprint.
     * @param {string} fingerprint - SHA-256 policy structure hash.
     * @returns {Promise<string[]>} Array of ACV transaction IDs.
     */
    async getAnchorsByFingerprint(fingerprint) {
        if (!fingerprint) return [];
        try {
            // Use KERNEL Tool capability for storage lookup
            const anchors = await KERNEL_SYNERGY_CAPABILITIES.Tool.execute('CRoTIndexStorage', 'lookup', fingerprint);
            
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
            // Use KERNEL Tool capability for storage append
            // Arguments: (interface, method, key, value, metadata)
            await KERNEL_SYNERGY_CAPABILITIES.Tool.execute('CRoTIndexStorage', 'append', fingerprint, txId, { timestamp: Date.now() });
            
            GAXTelemetry.info('CRoT_IndexWrite_Success', { txId, fingerprint: fingerprint.substring(0, 8) });
        } catch (error) {
            GAXTelemetry.critical('CRoT_IndexWrite_Failure', { txId, error: error.message, fingerprint: fingerprint.substring(0, 8) });
            throw new Error(`CRoT Indexing failed for TX ID ${txId}. Failure: ${error.message}`);
        }
    }
}

module.exports = CRoTIndexClient;