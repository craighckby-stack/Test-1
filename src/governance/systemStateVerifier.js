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

export class SystemStateVerifier {

    /**
     * Internal utility to calculate the System State Hash (SSH).
     * @private
     */
    _calculateSystemStateHash(configHash, codeHash, proposalID) {
        if (!configHash || !codeHash || !proposalID) {
            throw new Error("[SSV] Cannot calculate SSH: Missing required context elements.");
        }
        // Hash structure: SHA256(ConfigHash:CodebaseHash:ProposalID)
        const combinedInput = `${configHash}:${codeHash}:${proposalID}`;
        return crypto.createHash('sha256').update(combinedInput).digest('hex');
    }

    /**
     * 1. Calculates a deep cryptographic hash of the current active code and configuration.
     * 2. Registers this state hash with the Mutation Chain Registrar (MCR).
     * @param {string} proposalID - The identifier for the mutation proposal being verified.
     * @returns {Promise<string>} The verified system state hash.
     */
    async verifyAndLockState(proposalID) {
        if (!proposalID) {
             throw new Error("Proposal ID is required to lock system state.");
        }
        try {
            // Step 1: Gather configuration and codebase elements for hashing
            const activeConfig = ConfigurationService.fetchCriticalConfigHash();
            const codebaseHash = CodebaseHasher.calculateActiveCodebaseHash();
    
            // Step 2: Combine and hash to create the definitive System State Hash (SSH)
            const ssh = this._calculateSystemStateHash(activeConfig, codebaseHash, proposalID);
    
            // Step 3: Register SSH on the ledger via MCR (mandatory traceability)
            await MCR.registerSystemStateHash(proposalID, ssh);
            console.log(`[SSV] State Locked successfully for ${proposalID}. SSH: ${ssh}`);
    
            return ssh;
        } catch (error) {
            console.error(`[SSV] CRITICAL ERROR during state verification for ${proposalID}:`, error.message);
            throw new Error(`State verification failed: ${error.message}`);
        }
    }

    /**
     * Verifies if the current deployed state matches an expected state hash.
     * Used primarily during post-execution audit or pre-rollback decision making.
     * 
     * This method now robustly retrieves the active context ID using the new 
     * ActiveStateContextManager, ensuring that the hash recalculation is based 
     * on the actual operational context.
     * 
     * @param {string} expectedHash - The hash registered during EPDP D.
     * @returns {Promise<boolean>}
     */
    async validateCurrentStateAgainstHash(expectedHash) {
        if (!expectedHash) {
             throw new Error("Expected hash must be provided for validation.");
        }
        
        try {
            const currentConfigHash = ConfigurationService.fetchCriticalConfigHash();
            const currentCodeHash = CodebaseHasher.calculateActiveCodebaseHash();
            
            // Step 1: Determine the operational context (Crucial fix from prior version)
            const activeProposalID = ActiveStateContextManager.getActiveProposalID();
            
            if (!activeProposalID) {
                console.error("[SSV] Cannot validate state: Active Proposal ID context is undefined. System integrity check requires defined context.");
                return false;
            }

            // Step 2: Recalculate hash based on current live state and defined context
            const liveRecalculatedHash = this._calculateSystemStateHash(
                currentConfigHash,
                currentCodeHash,
                activeProposalID
            );

            if (liveRecalculatedHash === expectedHash) {
                console.log(`[SSV] State Integrity verified successfully against context ${activeProposalID}.`);
                return true;
            } else {
                console.error(`[SSV] State Integrity Failure (Context ${activeProposalID}): Expected ${expectedHash}, Found discrepancy ${liveRecalculatedHash}.`);
                return false;
            }
        } catch (error) {
             console.error(`[SSV] CRITICAL ERROR during state validation:`, error.message);
             return false;
        }
    }
}