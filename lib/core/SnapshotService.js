// Purpose: Handles the persistence, indexing, and retrieval of immutable state snapshots (S01, S02, etc.) for code, metrics, and resources.
// These snapshots serve as the baselines referenced by mandate constraints.

declare const ImmutableReferenceResolver: {
    getSnapshot(refKey: string): Promise<any>;
    createSnapshot(label: string, stateData: any): Promise<string>;
};

class SnapshotService {
    private resolver: typeof ImmutableReferenceResolver;

    constructor() {
        // Assuming the AGI kernel dependency injection makes the resolver available.
        // In a secured environment, this tool handles the actual lookup against content-addressed storage.
        if (typeof ImmutableReferenceResolver === 'undefined') {
            console.error("ImmutableReferenceResolver plugin not found. Initialization error.");
            throw new Error("Required utility ImmutableReferenceResolver is missing.");
        } 
        this.resolver = ImmutableReferenceResolver;
    }

    /**
     * Retrieves a complete system state snapshot based on a reference key.
     * @param {string} refKey - The context key (e.g., 'S02_BASELINE').
     * @returns {Promise<Object>} Snapshot data containing metric and artifact states.
     */
    async getSnapshot(refKey: string): Promise<Object> {
        console.log(`Retrieving snapshot via resolver for key: ${refKey}`);
        try {
            return await this.resolver.getSnapshot(refKey);
        } catch (error) {
            // Standardize error reporting for consumers
            throw new Error(`Snapshot reference key ${refKey} could not be resolved.`);
        }
    }

    /**
     * Stores and indexes a new immutable snapshot of the current operational state.
     * @param {string} label - A human-readable label for the snapshot (e.g., 'PRE_EVOLUTION').
     * @param {Object} stateData - The data capturing the current state.
     * @returns {Promise<string>} The generated, unique reference key for the new snapshot.
     */
    async createSnapshot(label: string, stateData: Object): Promise<string> {
        // Delegation: The underlying resolver handles the cryptographic hashing, storage, and key indexing.
        console.log(`Requesting snapshot creation for label: ${label}`);
        return await this.resolver.createSnapshot(label, stateData);
    }
}

export const snapshotService = new SnapshotService();