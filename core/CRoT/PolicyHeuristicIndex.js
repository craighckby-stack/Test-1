const crypto = require('crypto');
const DeepNormalizer = require('../../utils/object/DeepNormalizer'); 
const GAXTelemetry = require('../../core/Telemetry/GAXTelemetryService.js');
// Assuming CRoTIndexClient is available via require for typing/dependency resolution (or injected by orchestrator)

/**
 * PolicyHeuristicIndex
 * Manages the generation of stable, structure-based policy fingerprints (SHA-256)
 * and utilizes an injected CRoTIndexClient for efficient retrieval and indexing 
 * of historical Axiomatic Consistency Validation (ACV) anchors.
 */
class PolicyHeuristicIndex {

    /**
     * @param {object} indexClient - An instance of CRoTIndexClient or a compatible persistence interface.
     */
    constructor(indexClient) {
        if (!indexClient || typeof indexClient.getAnchorsByFingerprint !== 'function') {
            // Mandatory dependency injection for persistence operations
            throw new Error("PolicyHeuristicIndex requires a valid CRoT Index Client instance.");
        }
        this.indexClient = indexClient;
        GAXTelemetry.system('CRoT_PHI_INIT', { source: 'PolicyHeuristicIndex' });
    }

    /**
     * Generates a stable cryptographic fingerprint for a proposed PolicyDelta.
     * This remains a static utility function as it is a pure computation.
     * 
     * @param {object} policyDelta - The PolicyDelta input object (must be serializable).
     * @returns {string} SHA-256 hash of the normalized JSON string.
     */
    static generateFingerprint(policyDelta) {
        const normalizedData = DeepNormalizer.stableStringify(policyDelta);
        
        return crypto.createHash('sha256')
                     .update(normalizedData)
                     .digest('hex');
    }

    /**
     * Generates a fingerprint using the instance method wrapper.
     * @param {object} policyDelta
     * @returns {string}
     */
    generate(policyDelta) {
        return PolicyHeuristicIndex.generateFingerprint(policyDelta);
    }

    /**
     * Queries the CRoT index using the policy fingerprint to retrieve relevant 
     * historical ACV IDs (Anchors) using the injected client.
     * 
     * @param {string} fingerprint - Policy hash derived from generateFingerprint.
     * @returns {Promise<string[]>} List of high-relevance ACV transaction IDs.
     */
    async getRelevantAnchorIDs(fingerprint) {
        const shortFingerprint = fingerprint.substring(0, 8);
        GAXTelemetry.debug('CRoT_INDEX_QUERY', { fingerprint: shortFingerprint, operation: 'lookup' });

        // Delegate storage interaction to the injected client.
        return this.indexClient.getAnchorsByFingerprint(fingerprint);
    }

    /**
     * Indexes a new successful ACV transaction after it is committed.
     * 
     * @param {string} txId - The successful transaction ID.
     * @param {object} policyDelta - The PolicyDelta that was committed.
     * @returns {Promise<void>}
     */
    async indexPolicyChange(txId, policyDelta) {
        const fingerprint = PolicyHeuristicIndex.generateFingerprint(policyDelta);
        const shortFingerprint = fingerprint.substring(0, 8);
        
        GAXTelemetry.publish('CRoT_INDEX_UPDATE', { 
            txId, 
            fingerprint: shortFingerprint,
            operation: 'index_commit'
        });
        
        // Delegate persistence logic to the injected client.
        await this.indexClient.indexCommit(fingerprint, txId);
    }
}

module.exports = { PolicyHeuristicIndex };