// src/governance/configIntegrityMonitor.js

const sha512 = require('../utils/cryptoUtils');
const CIMIntegrityError = require('../system/CIMIntegrityError');

/**
 * Component: CIM (Configuration Integrity Monitor) v94.1
 * Role: Policy Protection Layer / Critical Integrity Checkpoint
 * Mandate: Ensures the immutability and integrity of critical governance configuration files 
 *          against unauthorized mutation or tampering using SHA-512 checksums verified against the Secure Policy Ledger (D-01).
 */
class ConfigIntegrityMonitor {
    
    constructor(auditLogger, proposalManager, configPaths = ConfigIntegrityMonitor.DEFAULT_CONFIG_PATHS) {
        if (!auditLogger || !proposalManager) {
            throw new Error("CIM Initialization Failure: Audit Logger (D-01) and Proposal Manager (A-01) required.");
        }
        
        this.auditLogger = auditLogger; // D-01 interface
        this.proposalManager = proposalManager; // A-01 interface
        this.configPaths = configPaths;
        
        this.currentHashes = {};
        this.isReady = false;
    }

    static get DEFAULT_CONFIG_PATHS() {
        return [
            'config/governance.yaml', 
            'config/veto_mandates.json'
        ];
    }

    /**
     * Initializes the CIM by loading the securely signed hashes from the secure ledger (D-01).
     */
    async initialize() {
        this.auditLogger.logSystemEvent("CIM", "Loading governance configuration checksums from secure source.");
        this.currentHashes = await this._loadSecureHashes();
        this.isReady = true;
    }

    /**
     * Internal method to fetch the known-good hashes from the D-01/Secure Policy Ledger.
     * @private
     */
    async _loadSecureHashes() {
        // Real implementation involves secure I/O/RPC to D-01
        // Mock data structure remains for initial bootstrap
        return {
            'config/governance.yaml': 'sha512-current-policy-hash-123',
            'config/veto_mandates.json': 'sha512-external-policy-hash-456'
        };
    }

    /**
     * Executes the integrity check against a computed hash.
     * @param {string} filePath - The path of the file being checked.
     * @param {string} currentContent - The actual content read from disk/memory.
     * @throws {CIMIntegrityError} If hash mismatch is detected.
     */
    checkIntegrity(filePath, currentContent) {
        if (!this.isReady) {
            throw new Error("CIM Not Initialized: Must call .initialize() first.");
        }

        const computedHash = sha512(currentContent);
        const knownHash = this.currentHashes[filePath];
        
        if (knownHash && knownHash !== computedHash) {
            const msg = `Integrity failure detected on ${filePath}. Computed hash mismatch. Unauthorized mutation suspected.`;
            this.auditLogger.logCritical("CIM VETO", msg, { file: filePath, expected: knownHash, actual: computedHash });
            throw new CIMIntegrityError(msg, filePath);
        }
        return true;
    }

    /**
     * Updates the secure integrity record post-P-01 approval (A-01 staging).
     * @param {string} filePath - Path of the file updated.
     * @param {string} approvedNewContent - Content approved by P-01/A-01.
     */
    async updateIntegrityRecord(filePath, approvedNewContent) {
        if (!this.isReady) {
             throw new Error("CIM Not Initialized.");
        }
        
        const newHash = sha512(approvedNewContent);

        // CRITICAL GATE: Ensures this change was legitimate and staged by A-01
        // Assumes proposalManager implements isAwaitingStaging(path, hash)
        if (!this.proposalManager.isAwaitingStaging(filePath, newHash)) {
            this.auditLogger.logCritical("CIM PROTECTION", `Attempted unapproved hash update for ${filePath}. Aborted.`);
            throw new Error("Unauthorized integrity record update attempt. Missing A-01 staging confirmation.");
        }

        this.currentHashes[filePath] = newHash;
        
        // Persist the change to the secure D-01 ledger
        await this.auditLogger.storeNewIntegrityHash(filePath, newHash); 
        this.auditLogger.logIntegrityUpdate(filePath, newHash);
    }
}

module.exports = ConfigIntegrityMonitor;