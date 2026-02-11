/**
 * @interface IImmutableReferenceResolver
 * Defines the required interface for the kernel utility responsible for
 * Content-Addressable Storage (CAS) operations specific to state snapshots.
 */
interface IImmutableReferenceResolver {
    getSnapshot(refKey: string): Promise<any>;
    createSnapshot(label: string, stateData: any): Promise<string>;
}

// Purpose: Handles the persistence, indexing, and retrieval of immutable state snapshots (S01, S02, etc.) for code, metrics, and resources.
// These snapshots serve as the baselines referenced by mandate constraints.

// We declare the dependency which is assumed to be provided by the AGI kernel environment.
declare const ImmutableReferenceResolver: IImmutableReferenceResolver;

class SnapshotService {
    private resolver: IImmutableReferenceResolver;

    constructor() {
        // Dependency injection check. We ensure the required kernel utility is available.
        if (typeof ImmutableReferenceResolver === 'undefined') {
            const errorMsg = "Required utility ImmutableReferenceResolver is missing.";
            console.error(`SnapshotService initialization error: ${errorMsg}`);
            throw new Error(errorMsg);
        } 
        this.resolver = ImmutableReferenceResolver;
    }

    /**
     * Retrieves a complete system state snapshot based on a reference key.
     * @param {string} refKey - The context key (e.g., 'S02_BASELINE').
     * @returns {Promise<Object>} Snapshot data containing metric and artifact states.
     */
    async getSnapshot(refKey: string): Promise<Object> {
        console.log(`SnapshotService: Retrieving snapshot via resolver for key: ${refKey}`);
        try {
            const snapshot = await this.resolver.getSnapshot(refKey);
            return snapshot as Object;
        } catch (error) {
            // Standardize error reporting while logging the underlying issue
            const message = `Snapshot reference key ${refKey} could not be resolved.`;
            console.error(`Error resolving snapshot ${refKey}:`, error);
            throw new Error(message);
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
        console.log(`SnapshotService: Requesting snapshot creation for label: ${label}`);
        return await this.resolver.createSnapshot(label, stateData);
    }
}

export const snapshotService = new SnapshotService();