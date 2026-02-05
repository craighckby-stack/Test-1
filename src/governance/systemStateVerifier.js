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

import { MCR } from '../governance/mutationChainRegistrar';
import { ConfigurationService } from '../config/configurationService';
import { CodebaseHasher } from '../utility/codebaseHasher';

export class SystemStateVerifier {

    /**
     * 1. Calculates a deep cryptographic hash of the current active code and configuration.
     * 2. Registers this state hash with the Mutation Chain Registrar (MCR).
     * @returns {string} The verified system state hash.
     */
    async verifyAndLockState(proposalID) {
        // Step 1: Gather configuration and codebase elements for hashing
        const activeConfig = ConfigurationService.fetchCriticalConfigHash();
        const codebaseHash = CodebaseHasher.calculateActiveCodebaseHash();

        // Step 2: Combine and hash to create the definitive System State Hash (SSH)
        const combinedInput = `${activeConfig}:${codebaseHash}:${proposalID}`;
        const ssh = crypto.createHash('sha256').update(combinedInput).digest('hex');

        // Step 3: Register SSH on the ledger via MCR (mandatory trace)
        await MCR.registerSystemStateHash(proposalID, ssh);
        console.log(`[SSV] State Locked for ${proposalID}. SSH: ${ssh}`);

        return ssh;
    }

    /**
     * Verifies if a given deployed state matches the expected state hash.
     * Used primarily during post-execution audit or pre-rollback decision making.
     * @param {string} expectedHash - The hash registered during EPDP D.
     * @returns {boolean}
     */
    async validateCurrentStateAgainstHash(expectedHash) {
        const currentConfigHash = ConfigurationService.fetchCriticalConfigHash();
        const currentCodeHash = CodebaseHasher.calculateActiveCodebaseHash();
        
        // Recalculate based on current live state (needs proposalID retrieval for accurate comparison, omitted for simplicity in scaffold)
        const liveRecalculatedHash = this.recalculateLiveHash(currentConfigHash, currentCodeHash);

        if (liveRecalculatedHash === expectedHash) {
            return true; // Integrity verified
        } else {
            console.error(`[SSV] State Integrity Failure: Expected ${expectedHash}, Found discrepancy.`);
            return false;
        }
    }

    recalculateLiveHash(config, code) {
        // In a real system, we'd need to fetch the proposalID related to the currently active version.
        const dummyProposalID = 'V94.1.001'; 
        const combinedInput = `${config}:${code}:${dummyProposalID}`;
        return crypto.createHash('sha256').update(combinedInput).digest('hex');
    }
}