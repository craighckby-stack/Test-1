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
// Dependency Injection / Plugin usage for integrity management
import { PayloadIntegrityStager } from '../plugins/PayloadIntegrityStager'; 

export class ArchProposalManager {
    constructor() {
        /** @type {Map<string, StagingEntry>} */
        this.stagingArea = new Map();
        this.auditLogger = new D01_AuditLogger();
        
        // Runtime check for essential plugin functions
        if (typeof PayloadIntegrityStager === 'undefined' || typeof PayloadIntegrityStager.createVerifiableEntry !== 'function') {
            // In a real kernel environment, this error would be handled by DI failure.
            console.warn("A-01 WARNING: PayloadIntegrityStager utility not properly initialized.");
        }
    }

    /**
     * @typedef {Object} DecisionEnvelope
     * @property {string} status - 'PASS', 'FAIL', etc.
     * @property {string} rationale - Consensus justification.
     */
    
    /**
     * @typedef {Object} StagingEntry 
     * @property {string} proposalId
     * @property {Object} payload - The mutation manifest.
     * @property {DecisionEnvelope} decision
     * @property {string} hash - Cryptographic hash of the payload.
     * @property {number} timestamp
     * @property {string} serialized - Internal serialized representation used for verification.
     */

    /**
     * Stages a validated proposal payload upon successful OGT decision.
     * Ensures payload immutability via robust hashing and Object.freeze via the Stager utility.
     * 
     * @param {string} proposalId 
     * @param {Object} proposalPayload - The mutation manifest (code changes, config updates).
     * @param {DecisionEnvelope} decisionEnvelope 
     * @returns {string | boolean} The transaction hash on success, or false on failure.
     */
    stageProposal(proposalId, proposalPayload, decisionEnvelope) {
        if (!decisionEnvelope || decisionEnvelope.status !== 'PASS') {
            this.auditLogger.logWarning(`A-01: Received rejected or invalid envelope for proposal ${proposalId}. Aborting stage.`);
            return false;
        }

        // 1. Generate immutable, verifiable entry using the utility
        // The utility handles hashing, freezing the payload, and serialization.
        const verifiableEntry = PayloadIntegrityStager.createVerifiableEntry(proposalPayload);
        const transactionHash = verifiableEntry.hash;
        
        /** @type {StagingEntry} */
        const stagingEntry = Object.freeze({ // Freeze the combined metadata
            proposalId,
            payload: verifiableEntry.payload,
            decision: decisionEnvelope,
            hash: transactionHash,
            timestamp: verifiableEntry.timestamp,
            serialized: verifiableEntry.serialized // Retain serialized data for efficient re-verification
        });

        this.stagingArea.set(proposalId, stagingEntry);
        this.auditLogger.logAction(`A-01: Proposal ${proposalId} staged successfully. Hash: ${transactionHash.substring(0, 10)}...`);
        return transactionHash;
    }

    /**
     * Hand off the immutable execution envelope to C-04 for atomic deployment.
     * Performs a final integrity check before execution.
     * 
     * @param {string} proposalId
     * @returns {boolean} True if execution initiated successfully, false otherwise.
     */
    commitAndExecute(proposalId) {
        /** @type {StagingEntry | undefined} */
        const stagedProposal = this.stagingArea.get(proposalId);

        if (!stagedProposal) {
            this.auditLogger.logError(`A-01: Proposal ${proposalId} not found in staging area. Execution failed.`);
            return false;
        }
        
        // Final integrity check: Delegate verification to the utility
        const integrityCheckPassed = PayloadIntegrityStager.verifyIntegrity(stagedProposal);
        
        if (!integrityCheckPassed) {
            this.auditLogger.logFatalError(`A-01: Data integrity failure for ${proposalId}. HASH MISMATCH detected between stage and commit. Execution aborted.`);
            return false;
        }

        this.auditLogger.logDebug(`A-01: Integrity check passed for ${proposalId}. Preparing C-04 handover.`);

        try {
            // Hand off to Autogeny Sandbox (C-04)
            const executionResult = C04_AutogenySandbox.executeMutation(stagedProposal.payload);
            
            if (executionResult) {
                this.stagingArea.delete(proposalId); // Clean staging area on success
                this.auditLogger.logAction(`A-01: Proposal ${proposalId} committed to C-04 successfully and staged entry deleted.`);
            } else {
                this.auditLogger.logError(`A-01: C-04 reported execution failure for ${proposalId}. Proposal remains staged.`);
            }
            return executionResult;
        } catch (error) {
            this.auditLogger.logFatalError(`A-01: Critical exception during C-04 execution handover for ${proposalId}: ${error.message}`);
            return false;
        }
    }
}