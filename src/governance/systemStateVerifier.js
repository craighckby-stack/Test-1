/**
 * Component ID: SSV
 * Component Name: System State Verifier
 * GSEP Role: EPDP D (Verification Lock)
 * Location: src/governance/systemStateVerifier.js
 *
 * Function: Generates and validates cryptographic state hashes of the critical operating environment.
 * This module ensures verifiable root-of-trust mapping before an architectural mutation is staged.
 * It provides the absolute reference point for atomic rollback operations.
 */

import * as crypto from 'crypto';
import { MCR } from '../governance/mutationChainRegistrar';
import { ConfigurationService } from '../config/configurationService';
import { CodebaseHasher } from '../utility/codebaseHasher';
import { ActiveStateContextManager } from './activeStateContextManager';
import { StateSnapshotRepository } from './stateSnapshotRepository'; // New dependency

export class SystemStateVerifier {

    /**
     * Calculates the definitive System State Hash (SSH) based on structured context.
     * @param {{configHash: string, codeHash: string, proposalID: string}} context
     * @returns {string}
     */
    static calculateSystemStateHash({ configHash, codeHash, proposalID }) {
        if (!configHash || !codeHash || !proposalID) {
            throw new Error("[SSV:HashGen] Incomplete context provided for System State Hash calculation.");
        }
        // Hash structure: SHA256(ConfigHash:CodebaseHash:ProposalID)
        const combinedInput = `${configHash}:${codeHash}:${proposalID}`;
        return crypto.createHash('sha256').update(combinedInput).digest('hex');
    }
    
    /**
     * Gathers the necessary hashes and the Proposal ID required to define a system state context.
     * @private
     * @param {string | null} [proposalIDForLocking=null] - Explicit ID used for locking a *new* state.
     * @returns {Promise<{configHash: string, codeHash: string, proposalID: string}>}
     */
    async _gatherCurrentSystemContext(proposalIDForLocking = null) {
        
        const configHash = ConfigurationService.fetchCriticalConfigHash();
        const codeHash = CodebaseHasher.calculateActiveCodebaseHash(); // Assuming synchronous or pre-computed, per original API
        
        let proposalID;
        
        if (proposalIDForLocking) {
            proposalID = proposalIDForLocking;
        } else {
            // Used for dynamic validation where the active context must be determined by the system.
            proposalID = ActiveStateContextManager.getActiveProposalID();
        }

        if (!proposalID) {
            throw new Error("[SSV:Context] Unable to determine operational context (Proposal ID is missing).");
        }

        return { configHash, codeHash, proposalID };
    }


    /**
     * 1. Calculates a deep cryptographic hash of the current active code and configuration.
     * 2. Persists the detailed snapshot (C, H, P, SSH) to the State Snapshot Repository (SSR).
     * 3. Registers this state hash with the Mutation Chain Registrar (MCR).
     * @param {string} proposalID - The identifier for the mutation proposal being verified.
     * @returns {Promise<string>} The verified system state hash.
     */
    async verifyAndLockState(proposalID) {
        if (!proposalID) {
             throw new Error("Proposal ID is required to lock system state.");
        }
        try {
            // Step 1: Gather and contextualize
            const context = await this._gatherCurrentSystemContext(proposalID);
    
            // Step 2: Calculate definitive System State Hash (SSH)
            const ssh = SystemStateVerifier.calculateSystemStateHash(context);

            // Step 3: Snapshot Persistence (Auditability Improvement)
            StateSnapshotRepository.saveSnapshot({ ...context, ssh });
    
            // Step 4: Register SSH on the ledger via MCR
            await MCR.registerSystemStateHash(proposalID, ssh);
            
            console.log(`[SSV:LOCK] State locked for ${proposalID}. SSH=${ssh.substring(0, 10)}...`);
    
            return ssh;
        } catch (error) {
            // Ensure failure handling is highly explicit for critical governance functions
            console.error(`[SSV:LOCK] CRITICAL FAILURE during state verification for ${proposalID}:`, error.message);
            throw new Error(`State verification failed: ${error.message}`);
        }
    }

    /**
     * Verifies if the current deployed state matches an expected state hash.
     * @param {string} expectedHash - The hash registered during the lock phase (EPDP D).
     * @returns {Promise<boolean>}
     */
    async validateCurrentStateAgainstHash(expectedHash) {
        if (!expectedHash) {
             throw new Error("Expected hash must be provided for validation.");
        }
        
        try {
            // Step 1: Gather context based on live operational environment
            const context = await this._gatherCurrentSystemContext();
            const activeProposalID = context.proposalID;

            // Step 2: Recalculate hash based on current live state and defined context
            const liveRecalculatedHash = SystemStateVerifier.calculateSystemStateHash(context);

            if (liveRecalculatedHash === expectedHash) {
                console.log(`[SSV:VERIFY] State Integrity verified successfully. Context ID: ${activeProposalID}`);
                return true;
            } 
            
            // State Integrity Failure: Log details clearly
            console.error(`[SSV:VERIFY] State Integrity Failure (ID: ${activeProposalID}). Expected: ${expectedHash.substring(0, 10)}..., Found: ${liveRecalculatedHash.substring(0, 10)}...`);
            return false;

        } catch (error) {
             console.error(`[SSV:VERIFY] CRITICAL ERROR during state validation:`, error.message);
             return false;
        }
    }
}