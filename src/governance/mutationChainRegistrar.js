// src/governance/mutationChainRegistrar.js
// Responsibility: Maintains an immutable, cryptographically chained ledger of all successful 
// and deployed architectural mutations (A-01 payloads).

/**
 * @typedef {object} MutationRecord
 * @property {number} timestamp - Time of registration.
 * @property {string} mutationId - Version ID from the payload.
 * @property {string} architecturalHash - Hash of the A-01 manifest.
 * @property {string} p01Hash - Confirmation hash proving successful deployment (P-01).
 * @property {string} previousChainHash - Hash of the preceding chain record.
 * @property {string} selfHash - Hash of this entire record structure (linkage).
 */

class MutationChainRegistrar {
    /**
     * @param {object} dependencies 
     * @param {AuditLogger} dependencies.auditLogger 
     * @param {IntegrityService} dependencies.integrityService 
     * @param {LedgerPersistence} dependencies.ledgerPersistence 
     */
    constructor({ auditLogger, integrityService, ledgerPersistence }) {
        if (!integrityService || !ledgerPersistence) {
            throw new Error("MCR requires IntegrityService and LedgerPersistence dependencies.");
        }

        this.auditLogger = auditLogger; 
        this.integrityService = integrityService; 
        this.ledgerPersistence = ledgerPersistence;

        // Load existing chain data using the Persistence service
        this.chain = this.ledgerPersistence.loadChainHistory();
        
        if (this.chain.length > 0) {
            this.auditLogger.logEvent('MCR_LOAD', `Loaded ${this.chain.length} records from history.`);
        } else {
            this.auditLogger.logEvent('MCR_INIT', 'Initialized GENESIS chain.');
        }
    }

    /**
     * Registers a finalized (A-01 locked) payload into the evolutionary chain.
     * @param {object} payload - The signed and versioned architectural manifest.
     * @param {string} p01ConfirmationHash - The immutable hash from D-01 proving P-01 success.
     * @returns {string} The selfHash of the newly registered record.
     */
    registerMutation(payload, p01ConfirmationHash) {
        if (!this.validatePayloadIntegrity(payload)) {
            this.auditLogger.logError('MCR_FAILURE', `Invalid payload signature received for version ${payload.versionId || 'unknown'}.`);
            throw new Error("MCR Registration Failure: Invalid payload signature or manifest integrity.");
        }

        // 1. Structure the new record
        const newRecordWithoutHash = {
            timestamp: Date.now(),
            mutationId: payload.versionId,
            // Ensure we hash only the core architectural definition (the manifest)
            architecturalHash: this.integrityService.calculateStableHash(payload.manifest), 
            p01Hash: p01ConfirmationHash,
            previousChainHash: this.getLatestChainHash()
        };

        // 2. Calculate the linkage hash (selfHash)
        const selfHash = this.integrityService.calculateStableHash(newRecordWithoutHash);
        
        const newRecord = { ...newRecordWithoutHash, selfHash };
        
        // 3. Commit locally and persist
        this.chain.push(newRecord);
        this.ledgerPersistence.persistChain(this.chain);

        this.auditLogger.logEvent('MCR_COMMITMENT', `Mutation ${payload.versionId} committed. Hash: ${selfHash.substring(0, 10)}...`);
        return selfHash;
    }

    /**
     * Retrieves the selfHash of the most recent record.
     * @returns {string}
     */
    getLatestChainHash() {
        // Uses a full-length zero hash placeholder for clarity and future integrity checks.
        const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
        if (this.chain.length === 0) return GENESIS_HASH;
        return this.chain[this.chain.length - 1].selfHash;
    }

    /**
     * Checks if the incoming A-01 payload meets required signature and structure.
     * @param {object} payload
     * @returns {boolean}
     */
    validatePayloadIntegrity(payload) {
        return (
            payload && 
            typeof payload.signature === 'string' && 
            typeof payload.versionId === 'string' &&
            typeof payload.manifest === 'object'
        ); 
    }
    
    getChainLength() {
        return this.chain.length;
    }

    getChain() {
        return this.chain;
    }
}

module.exports = MutationChainRegistrar;
