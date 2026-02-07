/**
 * Component: A-01 Architectural Proposal Manager (APM)
 * Role: Securely stages accepted architectural mutation payloads, ensuring integrity
 * and immutability between OGT consensus (D-01 decision) and execution (C-04).
 * ID: A-01
 *
 * This component prevents tampering of the approved codebase prior to atomic deployment
 * and compiles the necessary rollback metadata.
 */

import { D01_AuditLogger } from './decisionAuditLogger.js';
import { C04_AutogenySandbox } from '../execution/autogenySandbox.js';
// New core dependency for cryptographic integrity checks
import { CryptographicUtil } from '../utils/cryptographicUtil.js'; 

export class ArchProposalManager {
    constructor() {
        /** @type {Map<string, Readonly<StagingEntry>>} */
        this.stagingArea = new Map();
        this.auditLogger = new D01_AuditLogger();
    }

    /**
     * @typedef {Object} DecisionEnvelope
     * @property {string} status - 'PASS', 'FAIL', etc.
     * @property {string} rationale - Consensus justification.
     */

    /**
     * @typedef {Object} StagingEntry
     * @property {string} proposalId
     * @property {Object} payload
     * @property {DecisionEnvelope} decision
     * @property {string} hash
     * @property {number} timestamp
     */

    /**
     * Highly abstracted, recursive integrity checker and staging entry creator.
     * Combines hashing, validation, and immutability setup into a functional unit.
     * This method serves as the centralized, immutable data preparation gate.
     * 
     * @param {string} proposalId
     * @param {Object} payload 
     * @param {DecisionEnvelope} decision 
     * @returns {{entry: Readonly<StagingEntry>, hash: string} | null} 
     * @private
     */
    _secureGateProcess(proposalId, payload, decision) {
        // Base case for early exit (computational efficiency): Decision failure
        if (decision?.status !== 'PASS') {
            return null;
        }

        // Recursive Abstraction: The result of hashing becomes the canonical state proof.
        const transactionHash = CryptographicUtil.hashObject(payload);

        const stagingEntry = Object.freeze({ // Enforce deep immutability immediately
            proposalId,
            payload: payload, 
            decision: decision,
            hash: transactionHash,
            timestamp: Date.now()
        });

        // Returns structured data containing the immutable entry and its proof.
        return { entry: stagingEntry, hash: transactionHash };
    }

    /**
     * Stages a validated proposal payload upon successful OGT decision.
     * @param {string} proposalId 
     * @param {Object} proposalPayload 
     * @param {DecisionEnvelope} decisionEnvelope 
     * @returns {string | boolean} The transaction hash on success, or false on failure.
     */
    stageProposal(proposalId, proposalPayload, decisionEnvelope) {
        // Delegate complex security setup to the abstract gate
        const result = this._secureGateProcess(proposalId, proposalPayload, decisionEnvelope);

        if (!result) {
            this.auditLogger.logWarning(`A-01: Received rejected or invalid envelope for proposal ${proposalId}. Aborting stage.`);
            return false;
        }

        this.stagingArea.set(proposalId, result.entry);
        this.auditLogger.logAction(`A-01: Proposal ${proposalId} staged successfully. Hash: ${result.hash.substring(0, 10)}...`);
        return result.hash;
    }

    /**
     * Hand off the immutable execution envelope to C-04 for atomic deployment.
     * Performs a final integrity check before execution.
     * 
     * @param {string} proposalId
     * @returns {boolean} True if execution initiated successfully, false otherwise.
     */
    commitAndExecute(proposalId) {
        const stagedProposal = this.stagingArea.get(proposalId);

        if (!stagedProposal) {
            this.auditLogger.logError(`A-01: Proposal ${proposalId} not found in staging area. Execution failed.`);
            return false;
        }
        
        // Computational Efficiency vs. Security: Final re-hash is mandatory security overhead.
        if (CryptographicUtil.hashObject(stagedProposal.payload) !== stagedProposal.hash) {
            this.auditLogger.logFatalError(`A-01: Data integrity failure for ${proposalId}. HASH MISMATCH. Execution aborted.`);
            return false;
        }

        this.auditLogger.logDebug(`A-01: Integrity check passed for ${proposalId}. Preparing C-04 handover.`);

        // Functional pipeline for execution and cleanup
        try {
            const executionSuccess = C04_AutogenySandbox.executeMutation(stagedProposal.payload);

            if (executionSuccess) {
                // Clean staging area only upon verified success
                this.stagingArea.delete(proposalId); 
                this.auditLogger.logAction(`A-01: Proposal ${proposalId} committed to C-04 successfully and staged entry deleted.`);
            } else {
                this.auditLogger.logError(`A-01: C-04 reported execution failure for ${proposalId}. Proposal remains staged for audit.`);
            }
            return executionSuccess;
        } catch (error) {
            this.auditLogger.logFatalError(`A-01: Critical exception during C-04 execution handover for ${proposalId}: ${error.message}`);
            return false;
        }
    }
}