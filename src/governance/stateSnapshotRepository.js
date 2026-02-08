/**
 * Component ID: SSR
 * Component Name: State Snapshot Repository
 * GSEP Role: EPDP D/E Auxiliary (Atomic State Tracing)
 * Location: src/governance/stateSnapshotRepository.js
 *
 * Function: Stores an immutable record of cryptographic components used to define
 * a System State Hash (SSH), providing a persistent, detailed audit trail for
 * rollback decisions and state integrity verification.
 *
 * NOTE ON IMMUTABILITY: All stored snapshots are defensively frozen to prevent runtime mutation.
 */

// NOTE: In a production environment, this should utilize a secure, append-only, 
// persistent store (like an isolated database table or tamper-proof log).
// For scaffolding, we use a simple in-memory structure.

const stateSnapshots = new Map();

/**
 * Defines the expected structure for a System State Snapshot.
 * @typedef {{ proposalID: string, configHash: string, codebaseHash: string, ssh: string, timestamp: number }} SystemStateSnapshot
 */

export class StateSnapshotRepository {

    /**
     * Internal utility for checking snapshot validity structure.
     * @param {any} snapshot 
     * @returns {boolean}
     */
    static _validateSnapshot(snapshot) {
        if (typeof snapshot !== 'object' || snapshot === null) {
            console.error(`[SSR Validation Error] Snapshot object is null or not an object.`);
            return false;
        }
        const requiredKeys = ['proposalID', 'configHash', 'codebaseHash', 'ssh'];
        for (const key of requiredKeys) {
            if (typeof snapshot[key] !== 'string' || snapshot[key].length === 0) {
                console.error(`[SSR Validation Error] Missing or invalid key: ${key}`);
                return false;
            }
        }
        if (typeof snapshot.timestamp !== 'number') {
             console.error(`[SSR Validation Error] Missing timestamp.`);
             return false;
        }
        return true;
    }

    /**
     * Saves the complete cryptographic context snapshot, ensuring immutability.
     * The proposalID serves as the unique identifier and transaction lock.
     * @param {SystemStateSnapshot} snapshot
     * @returns {void}
     */
    static saveSnapshot(snapshot) {
        if (!StateSnapshotRepository._validateSnapshot(snapshot)) {
            console.error(`[SSR] Critical Error: Invalid snapshot provided. Refusing to store immutable record.`);
            return;
        }

        if (stateSnapshots.has(snapshot.proposalID)) {
            // Immutability Check: Prevent overwriting existing, locked state records.
            console.warn(`[SSR] Warning: Attempted to overwrite state snapshot for Proposal ID ${snapshot.proposalID}. Operation skipped due to immutability mandate.`);
            return;
        }
        
        // Store the immutable record defensively copied and frozen.
        const immutableRecord = Object.freeze({ ...snapshot });
        stateSnapshots.set(snapshot.proposalID, immutableRecord);
        console.info(`[SSR] State snapshot successfully locked and saved for Proposal ID: ${snapshot.proposalID}. Total records: ${stateSnapshots.size}.`);
    }

    /**
     * Retrieves a detailed snapshot by Proposal ID.
     * @param {string} proposalID
     * @returns {SystemStateSnapshot | undefined}
     */
    static getSnapshot(proposalID) {
        // Returns the frozen object or undefined, maintaining read-only access.
        return stateSnapshots.get(proposalID);
    }

    /**
     * Checks if a snapshot exists for a given Proposal ID, crucial for integrity checks.
     * @param {string} proposalID
     * @returns {boolean}
     */
    static hasSnapshot(proposalID) {
        return stateSnapshots.has(proposalID);
    }

    /**
     * Clears all snapshots. Restricted to privileged environment resets/testing.
     * @returns {void}
     */
    static clearRepository() {
        const count = stateSnapshots.size;
        stateSnapshots.clear();
        console.warn(`[SSR] Repository Cleared. ${count} records forcefully removed.`);
    }

    /**
     * Retrieves the total count of stored snapshots (Metric).
     * @returns {number}
     */
    static getSize() {
        return stateSnapshots.size;
    }
}