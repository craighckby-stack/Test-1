const { SerializedAsyncQueueWriter } = require('../plugins/SerializedAsyncQueueWriter');

/**
 * DecisionAuditLogger
 * Records all OGT adjudication results asynchronously and immutably 
 * using a specialized, buffered, and serialized queue writer in JSON Lines format.
 * All complex I/O handling is delegated to the SerializedAsyncQueueWriter plugin.
 */
class DecisionAuditLogger {
    /**
     * @param {object} config - Configuration object.
     * @param {string} config.filePath - Path to the audit log file.
     * @param {number} [config.batchSize=100] - Number of records to buffer before forcing a disk write.
     * @param {number} [config.flushIntervalMs=5000] - Interval (ms) for periodic flushing.
     */
    constructor({ filePath, batchSize = 100, flushIntervalMs = 5000 }) {
        if (!filePath) {
            throw new Error("DecisionAuditLogger requires a filePath configuration.");
        }
        
        // The specialized writer handles all I/O complexity (buffering, serialization, timing)
        this.writer = new SerializedAsyncQueueWriter(batchSize, flushIntervalMs);
        this.filePath = filePath;
        this.isInitialized = false;
    }

    /**
     * Initializes the logger by opening the underlying file stream.
     */
    init() {
        if (this.isInitialized) {
            console.warn("DecisionAuditLogger already initialized.");
            return;
        }
        
        this.writer.init(this.filePath);
        this.isInitialized = true;
    }

    /**
     * Logs a single OGT decision adjudication result.
     * The decision data is immutably recorded immediately into the queue.
     * 
     * @param {object} decisionData - The immutable data object representing the decision result.
     */
    logDecision(decisionData) {
        if (!this.isInitialized) {
            console.warn("Attempted to log decision before logger was initialized.");
            return;
        }

        try {
            // Domain-specific task: Formatting the object into a JSON Line
            const logLine = JSON.stringify(decisionData) + '\n';
            
            // Delegate I/O to the specialized writer
            this.writer.write(logLine);
        } catch (error) {
            console.error("Failed to serialize decision data for logging:", error, decisionData);
        }
    }

    /**
     * Flushes all pending audit records to disk and closes the underlying file stream.
     * Should be called during graceful application shutdown.
     * @returns {Promise<void>}
     */
    async flush() {
        if (!this.isInitialized) return;
        console.log("DecisionAuditLogger commencing graceful flush...");
        await this.writer.flush();
        this.isInitialized = false;
    }
}

module.exports = { DecisionAuditLogger };