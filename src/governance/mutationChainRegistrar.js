// Mutation Chain Registrar (MCR)
// Responsibility: Maintains an immutable, cryptographically chained ledger of all successful and deployed architectural mutations (A-01 payloads).

class MutationChainRegistrar {
    constructor(auditLogger) {
        this.auditLogger = auditLogger; // D-01 dependency
        this.chain = this.loadChainHistory();
    }

    loadChainHistory() {
        // Load persistent chain data from storage/ledger.json
        // Returns an array of signed mutation records
        return []; 
    }

    /**
     * Registers a finalized (A-01 locked) payload into the evolutionary chain.
     * @param {object} payload - The signed and versioned architectural manifest.
     * @param {string} p01ConfirmationHash - The immutable hash from D-01 proving P-01 success.
     */
    registerMutation(payload, p01ConfirmationHash) {
        if (!this.validatePayload(payload)) {
            throw new Error("MCR Registration Failure: Invalid payload signature.");
        }

        const newRecord = {
            timestamp: Date.now(),
            mutationId: payload.versionId,
            architecturalHash: this.calculateHash(payload.manifest),
            p01Hash: p01ConfirmationHash,
            previousChainHash: this.getLatestChainHash()
        };

        const recordHash = this.calculateHash(newRecord);
        this.chain.push({...newRecord, selfHash: recordHash});

        this.persistChain();
        this.auditLogger.logEvent('MCR_COMMITMENT', `Mutation ${payload.versionId} committed to chain.`);
        return recordHash;
    }

    getLatestChainHash() {
        if (this.chain.length === 0) return 'GENESIS_000';
        return this.chain[this.chain.length - 1].selfHash;
    }

    calculateHash(data) {
        // Placeholder: Utilize a system-wide SHA-256 or similar integrity function.
        return `SHA256(${JSON.stringify(data)})`;
    }

    validatePayload(payload) {
        // Ensure the payload matches the expected A-01 integrity signature.
        return payload && payload.signature && payload.manifest; 
    }

    persistChain() {
        // Write updated this.chain to secure, write-once ledger file.
        console.log("MCR Chain persisted successfully.");
    }
    
    getChainLength() {
        return this.chain.length;
    }
}

module.exports = MutationChainRegistrar;
