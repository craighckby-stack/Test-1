/**
 * Component ID: ASCM
 * Component Name: Active State Context Manager
 * GSEP Role: EPDP F (Deployment Traceability Lookup)
 * Location: src/governance/activeStateContextManager.js
 *
 * Function: Manages and provides access to the globally agreed-upon identifier 
 * of the currently active architectural state (Proposal ID, Version Hash). 
 * This is essential for SSV to correctly identify the context when performing audits.
 */

export class ActiveStateContextManager {
    // Note: In a production system, this storage would be persistent (e.g., in secure configuration space or MCR)
    // and protected by atomic write locks.
    static currentProposalID = null;

    /**
     * Registers the state context confirmed immediately post-deployment/successful rollout.
     * This update must be protected by internal governance locks, indicating the system's operational root-of-trust.
     * @param {string} proposalID - The identifier of the successfully deployed system state.
     */
    static setActiveProposalID(proposalID) {
        if (!proposalID) throw new Error("[ASCM] Proposal ID cannot be null when setting active context.");
        
        // TODO: V94.2: Implement critical section locking (EPDP Lock)
        this.currentProposalID = proposalID;
        console.log(`[ASCM] Active state context successfully set to: ${proposalID}`);
    }

    /**
     * Retrieves the Proposal ID corresponding to the current verifiable operating state.
     * @returns {string | null} The active proposal ID or null if undefined (e.g., initial bootstrap).
     */
    static getActiveProposalID() {
        return this.currentProposalID;
    }
}