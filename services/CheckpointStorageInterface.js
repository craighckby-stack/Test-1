// Define the abstract interface for checkpoint management
abstract class CheckpointStorageInterface {

    protected config: object;

    /**
     * Initializes the storage mechanism based on config.
     * @param config - The checkpoint configuration.
     */
    constructor(config: object) {
        if (new.target === CheckpointStorageInterface) {
            throw new TypeError("Cannot construct CheckpointStorageInterface instances directly. Must be subclassed.");
        }
        this.config = config;
    }

    /**
     * Saves the evolutionary state object.
     * @param runId - The current evolution run ID.
     * @param state - The full state object to serialize.
     * @param metadata - Metadata about the state.
     * @returns A Promise resolving to the identifier (Path or URL) of the saved checkpoint.
     */
    public abstract saveCheckpoint(runId: string, state: object, metadata: object): Promise<string>;

    /**
     * Loads the latest or specific checkpoint.
     * @param checkpointId - Optional specific ID/path to load.
     * @returns A Promise resolving to the loaded state object.
     */
    public abstract loadCheckpoint(checkpointId?: string): Promise<object>;

    /**
     * Cleans up old checkpoints based on retention policy defined in the config.
     * @param runId - The current evolution run ID.
     */
    public abstract cleanUp(runId: string): Promise<void>;
}

module.exports = CheckpointStorageInterface;