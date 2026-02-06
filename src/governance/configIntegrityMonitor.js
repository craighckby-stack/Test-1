// src/governance/configIntegrityMonitor.js

const sha512 = require('../utils/cryptoUtils');
const CIMIntegrityError = require('../system/CIMIntegrityError');

/**
 * Component: CIM (Configuration Integrity Monitor) v94.1
 * Role: Policy Protection Layer / Critical Integrity Checkpoint
 * Mandate: Ensures the immutability and integrity of critical governance configuration files 
 *          against unauthorized mutation or tampering using cryptographically strong checksums (SHA-512) 
 *          verified against the Secure Policy Ledger (D-01).
 */
class ConfigIntegrityMonitor {
    
    // Defines the critical configuration files that MUST be integrity monitored.
    static get CRITICAL_TARGETS() {
        return Object.freeze([
            'config/governance.yaml', 
            'config/veto_mandates.json'
        ]);
    }

    /**
     * @param {object} dependencies 
     * @param {object} dependencies.auditLogger - D-01 Interface for logging. Must implement logCritical, logSystemEvent, logSecurityUpdate.
     * @param {object} dependencies.proposalManager - A-01 Interface for staging approval checks. Must implement retrieveApprovedHash.
     * @param {object} dependencies.policyLedgerInterface - Dedicated D-01 I/O interface (Must implement getPolicyHashes, storeNewIntegrityHash).
     * @param {string[]} [configPaths] - Optional list of paths to monitor. Defaults to CRITICAL_TARGETS.
     */
    constructor({ auditLogger, proposalManager, policyLedgerInterface }, configPaths = ConfigIntegrityMonitor.CRITICAL_TARGETS) {
        if (!auditLogger || !proposalManager || !policyLedgerInterface) {
            throw new Error("CIM Initialization Failure (E941A): Essential interfaces (Logger, A-01, D-01) required.");
        }
        
        this.auditLogger = auditLogger; 
        this.proposalManager = proposalManager; 
        this.policyLedgerInterface = policyLedgerInterface; 
        
        // Ensure configuration set is frozen and defensive copy is used.
        this.configPaths = Object.freeze([...new Set(configPaths)]); 
        
        this.currentHashes = {}; // Map<filePath, expectedHash>
        this.isReady = false;
        
        // Runtime validation check for critical D-01 methods
        if (typeof this.policyLedgerInterface.getPolicyHashes !== 'function') {
             throw new TypeError("PolicyLedgerInterface missing required method: getPolicyHashes.");
        }
    }

    /**
     * Initializes the CIM state by loading the securely signed integrity digests from the D-01 ledger.
     * This operation is blocking and fails the host process if critical integrity state cannot be established.
     * @async
     */
    async initialize() {
        if (this.isReady) return; // Idempotency check

        this.auditLogger.logSystemEvent("CIM_INIT", "Attempting secure checksum load from D-01.", { targets: this.configPaths.length });
        
        try {
            // Securely fetch hashes
            const fetchedHashes = await this.policyLedgerInterface.getPolicyHashes(this.configPaths);

            // Critical validation: Ensure all defined paths were retrieved and are valid strings.
            for (const path of this.configPaths) {
                if (!fetchedHashes[path] || typeof fetchedHashes[path] !== 'string' || fetchedHashes[path].length < 64) {
                    // Fail fast if D-01 is missing integrity data for a mandatory target.
                    throw new Error(`Mandatory integrity hash missing or invalid from D-01 for path: ${path}`);
                }
            }

            this.currentHashes = fetchedHashes;
            this.isReady = true;
            this.auditLogger.logSystemEvent("CIM_INIT_SUCCESS", `CIM operational, monitoring ${this.configPaths.length} targets.`);
        } catch (error) {
             const context = { paths: this.configPaths, error: error.message };
             this.auditLogger.logCritical("CIM_INIT_VETO", "Failed to establish CIM operational state. Potential security vulnerability or Ledger failure.", context);
             // Re-throw to halt system startup.
             throw new Error(`CIM initialization fatal error: ${error.message}`);
        }
    }

    /**
     * Executes the integrity check against a provided content string/buffer.
     * This is the highest severity check in the governance chain.
     * @param {string} filePath - The monitored path.
     * @param {string|Buffer} currentContent - The raw content string (or Buffer) of the file.
     * @returns {boolean} True if integrity is verified.
     * @throws {CIMIntegrityError} If a hash mismatch or untracked path is detected.
     */
    checkIntegrity(filePath, currentContent) {
        if (!this.isReady) {
            throw new Error("CIM State Error: Operational Integrity Monitor must be initialized before use (E941B).");
        }

        const knownHash = this.currentHashes[filePath];
        
        if (!knownHash) {
            // Code D941C: Untracked path veto. Policy violation (Targeted file added without D-01 registration).
            const err = `Configuration path '${filePath}' is untracked by Policy Ledger. Integrity Veto D941C Issued.`;
            this.auditLogger.logCritical("CIM_UNTRACKED_VETO", err, { file: filePath });
            // CIMIntegrityError should handle the classification
            throw new CIMIntegrityError(err, filePath, 'UNTRACKED_CONFIG'); 
        }

        const computedHash = sha512(currentContent);
        
        if (knownHash !== computedHash) {
            // Code D941D: Hash mismatch veto. Security failure (Unauthorized mutation).
            const msg = `Integrity failure detected on '${filePath}'. Hash mismatch (D941D). Mutation suspected.`;
            // Log only a truncated version of the actual hash to prevent accidental leakage/over-logging of sensitive state
            this.auditLogger.logCritical("CIM_MUTATION_VETO", msg, { file: filePath, expected: knownHash.substring(0, 16) + '...', actual: computedHash.substring(0, 16) + '...' });
            throw new CIMIntegrityError(msg, filePath, 'HASH_MISMATCH');
        }
        
        this.auditLogger.logSystemEvent("CIM_VERIFIED", `Integrity of ${filePath} verified successfully.`);
        return true;
    }

    /**
     * Updates the secure integrity record post-P-01 approval (A-01 staging).
     * This is a sensitive operation protected by the A-01 proposal digest.
     * @async
     * @param {string} filePath - Path of the file updated.
     * @returns {Promise<void>} 
     * @throws {Error} If A-01 digest is missing or D-01 write fails.
     */
    async updateIntegrityRecord(filePath) {
        if (!this.isReady) {
             throw new Error("CIM State Error: Cannot update record until initialized.");
        }
        
        const approvedStateDigest = this.proposalManager.retrieveApprovedHash(filePath);

        if (!approvedStateDigest || typeof approvedStateDigest !== 'string' || approvedStateDigest.length < 64) {
            const context = { file: filePath, digest: approvedStateDigest };
            this.auditLogger.logCritical("CIM_RECORD_UPDATE_VETO", `Integrity update rejected (E941E). Missing valid approved A-01 state digest.`, context);
            throw new Error("Integrity record update vetoed. Missing valid A-01 approval stage data.");
        }

        const oldHash = this.currentHashes[filePath] || 'N/A';
        
        // Tentative local update
        this.currentHashes[filePath] = approvedStateDigest;
        
        try {
            // Durable commit to secure ledger
            await this.policyLedgerInterface.storeNewIntegrityHash(filePath, approvedStateDigest); 
            
            this.auditLogger.logSystemEvent("CIM_RECORD_COMMITTED", `Integrity digest for ${filePath} securely updated in D-01.`, {
                oldHash: oldHash.substring(0, 16) + '...', 
                newHash: approvedStateDigest.substring(0, 16) + '...'
            });

        } catch (error) {
            // CRITICAL RECOVERY: If D-01 commit fails, revert the in-memory state to preserve consistency.
            this.currentHashes[filePath] = oldHash;
            this.auditLogger.logCritical("D01_COMMIT_FAILURE", `Failed to commit new hash for ${filePath}. Local state reverted. CIM state unstable.`, { error: error.message });
            throw error; // Propagate failure to halt the deployment process.
        }
    }
}

module.exports = ConfigIntegrityMonitor;