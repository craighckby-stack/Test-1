/**
 * Component ID: SMR
 * Component Name: State Metadata Registry
 * GSEP Role: EPDP G (Configuration Lookup/Auditing Metadata)
 * Location: src/governance/stateMetadataRegistry.js
 *
 * Function: Stores immutable metadata associated with historical or active architectural states (Proposal IDs).
 * Provides contextual information needed for auditing, rollback planning, and verification of 
 * configuration integrity (e.g., linked configuration files, approval history, rollout timestamps).
 */

import { SystemLogger } from '../system/systemLogger'; // Assuming standard logger presence
import { GovernanceError } from '../utilities/governance/governancePrimitives';

/**
 * @typedef {Object} StateMetadata
 * @property {string} proposalID - Key identifier (matches ASCM ID).
 * @property {string} deploymentHash - Codebase hash (matches ASCM Hash).
 * @property {Object} configPayload - Snapshot of critical configuration parameters used during deployment.
 * @property {string[]} approvingAuthorities - List of IDs confirming this deployment.
 * @property {number} approvalTimestamp - Timestamp of governance approval.
 * @property {string | null} predecessorID - Proposal ID of the state this state replaced.
 */

export class StateMetadataRegistry {
    /** @type {Map<string, StateMetadata>} Map: ProposalID -> Metadata */
    static #metadataCache = new Map();

    /**
     * Registers immutable metadata for a newly deployed or approved state.
     * Registration should typically occur immediately post-approval and prior to deployment by ASCM.
     * @param {StateMetadata} metadata - The complete metadata object.
     */
    static registerMetadata(metadata) {
        if (!metadata || !metadata.proposalID || !metadata.deploymentHash) {
            SystemLogger.error("[SMR] Cannot register metadata: Missing required fields (proposalID or deploymentHash).");
            throw new GovernanceError("Invalid metadata structure provided for registration.", "SMR_E001");
        }

        const key = metadata.proposalID;
        if (StateMetadataRegistry.#metadataCache.has(key)) {
            SystemLogger.warn(`[SMR] Metadata for state ${key} already exists. Skipping redundant write.`);
            return;
        }
        
        // Ensure the stored data is immutable
        StateMetadataRegistry.#metadataCache.set(key, Object.freeze(metadata));
        SystemLogger.info(`[SMR] Successfully registered metadata for state: ${key}.`);
    }

    /**
     * Retrieves the stored metadata for a specific architectural state ID.
     * @param {string} proposalID - The identifier of the desired state.
     * @returns {StateMetadata | null}
     */
    static getMetadata(proposalID) {
        return StateMetadataRegistry.#metadataCache.get(proposalID) || null;
    }

    /**
     * Checks if metadata for a given state has been registered.
     * @param {string} proposalID
     * @returns {boolean}
     */
    static hasMetadata(proposalID) {
        return StateMetadataRegistry.#metadataCache.has(proposalID);
    }
}