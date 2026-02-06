// src/governance/configIntegrityMonitor.js

const sha512 = require('../utils/cryptoUtils');
const CIMIntegrityError = require('../system/CIMIntegrityError');

/**
 * Component: CIM (Configuration Integrity Monitor) v94.1
 * Role: Policy Protection Layer / Critical Integrity Checkpoint
 * Mandate: Ensures the immutability and integrity of critical governance configuration files 
 *          against unauthorized mutation or tampering using SHA-512 checksums verified 
 *          against the Secure Policy Ledger (D-01) via the Ledger Interface.
 */
class ConfigIntegrityMonitor {
    
    // Default governance targets for monitoring
    static get DEFAULT_CONFIG_PATHS() {
        return Object.freeze([
            'config/governance.yaml', 
            'config/veto_mandates.json'
        ]);
    }

    /**
     * @param {object} auditLogger - D-01 Interface for logging.
     * @param {object} proposalManager - A-01 Interface for staging approval checks.
     * @param {object} policyLedgerInterface - Dedicated D-01 I/O interface (Proposed Scaffold).
     */
    constructor(auditLogger, proposalManager, policyLedgerInterface, configPaths = ConfigIntegrityMonitor.DEFAULT_CONFIG_PATHS) {
        if (!auditLogger || !proposalManager || !policyLedgerInterface) {
            throw new Error("CIM Initialization Failure: Audit Logger, Proposal Manager, and Policy Ledger Interface required.");
        }
        
        this.auditLogger = auditLogger; 
        this.proposalManager = proposalManager; 
        this.policyLedgerInterface = policyLedgerInterface; 
        
        this.configPaths = Object.freeze(configPaths); // Defensive immutability
        this.currentHashes = {}; // In-memory cache of expected hashes
        this.isReady = false;
    }

    /**
     * Initializes the CIM by loading the securely signed hashes from the secure ledger (D-01).
     * This must run before any integrity checks are performed.
     */
    async initialize() {
        this.auditLogger.logSystemEvent("CIM", "Loading governance configuration checksums from secure source (D-01).");
        try {
            this.currentHashes = await this._fetchInitialPolicyHashes();
            this.isReady = true;
        } catch (error) {
             this.auditLogger.logCritical("CIM INIT FAILURE", "Failed to load initial integrity hashes from D-01.", { error: error.message });
             throw error;
        }
    }

    /**
     * Internal method to fetch the known-good hashes from the D-01/Secure Policy Ledger.
     * @private
     * @returns {Promise<Object<string, string>>} Map of filePath to hash.
     */
    async _fetchInitialPolicyHashes() {
        // Now uses the dedicated SecurePolicyLedgerInterface
        return this.policyLedgerInterface.getPolicyHashes(this.configPaths);
    }

    /**
     * Executes the integrity check against a computed hash.
     * @param {string} filePath - The path of the file being checked.
     * @param {string} currentContent - The actual content read from disk/memory.
     * @throws {CIMIntegrityError} If hash mismatch is detected or configuration path is unrecognized.
     */
    checkIntegrity(filePath, currentContent) {
        if (!this.isReady) {
            throw new Error("CIM Not Initialized: Must call .initialize() first.");
        }

        const knownHash = this.currentHashes[filePath];

        if (!knownHash) {
            // High severity: A file designated for monitoring is not tracked. Tampering/misconfig suspected.
            const err = `Configuration path ${filePath} is untracked by CIM Policy Ledger. Veto issued.`;
            this.auditLogger.logCritical("CIM UNTRACKED VETO", err, { file: filePath });
            throw new CIMIntegrityError(err, filePath);
        }

        const computedHash = sha512(currentContent);
        
        if (knownHash !== computedHash) {
            const msg = `Integrity failure detected on ${filePath}. Computed hash mismatch. Unauthorized mutation suspected.`;
            this.auditLogger.logCritical("CIM INTEGRITY VETO", msg, { file: filePath, expected: knownHash, actual: computedHash });
            throw new CIMIntegrityError(msg, filePath);
        }
        return true;
    }

    /**
     * Updates the secure integrity record post-P-01 approval (A-01 staging).
     * Signature changed: Relies solely on Proposal Manager (A-01) for the approved state digest (hash).
     * @param {string} filePath - Path of the file updated.
     * @returns {Promise<void>}
     */
    async updateIntegrityRecord(filePath) {
        if (!this.isReady) {
             throw new Error("CIM Not Initialized.");
        }
        
        // 1. Fetch the cryptographically signed, approved hash directly from A-01 staging
        const approvedStateDigest = this.proposalManager.retrieveApprovedHash(filePath);

        if (!approvedStateDigest) {
            this.auditLogger.logCritical("CIM PROTECTION", `Integrity update request rejected for ${filePath}. No valid A-01 proposal found or retrieved hash is null.`);
            throw new Error("Unauthorized integrity record update attempt. Missing A-01 approval stage.");
        }

        // 2. Commit the new hash to the local state and secure D-01 ledger
        this.currentHashes[filePath] = approvedStateDigest;
        
        await this.policyLedgerInterface.storeNewIntegrityHash(filePath, approvedStateDigest); 

        this.auditLogger.logIntegrityUpdate(filePath, approvedStateDigest);
    }
}

module.exports = ConfigIntegrityMonitor;