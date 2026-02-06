/**
 * Component ID: D-01
 * Decision Audit Logger: Immutably records all OGT adjudication results.
 * Essential for traceability, regulatory compliance, and feeding the
 * post-mortem analysis engine.
 *
 * Refactoring Rationale:
 * 1. Implemented an asynchronous write queue and batching mechanism (using BATCH_SIZE).
 * 2. Decouples the critical path (logDecision) from slow disk I/O, dramatically increasing throughput.
 * 3. Ensures write serialization internally, guaranteeing log file integrity (.jsonl format).
 * 4. Added flush() and dispose() methods for graceful shutdown, ensuring no audit logs are lost.
 * 5. Uses setInterval with unref() for a safety flush mechanism, ensuring eventual persistence even during low activity.
 */

const fs = require('fs/promises');
const path = require('path');

// --- Configuration Constants ---
// These constants should ideally be injected from a Configuration Service (C-01)
const DEFAULT_LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE_NAME = 'ogt_decisions.jsonl';
const AUDIT_PATH = path.join(DEFAULT_LOG_DIR, LOG_FILE_NAME);
const BATCH_SIZE = 50; // Number of entries to aggregate before a single appendFile call
const FLUSH_INTERVAL_MS = 5000; // Safety interval for periodic flushing if the queue is idle

class DecisionAuditLogger {
    constructor() {
        this.initialized = false;
        this.initializationPromise = null;
        this.writeQueue = [];
        this.isProcessing = false;
        this.flushInterval = null;
    }

    /**
     * Ensures the log directory exists and prepares the logger. Must be awaited once.
     * Subsequent calls return the same promise.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            const dir = path.dirname(AUDIT_PATH);
            try {
                await fs.mkdir(dir, { recursive: true });
                this.initialized = true;
                
                // Start safety interval
                this.flushInterval = setInterval(() => this._processQueue(), FLUSH_INTERVAL_MS);
                this.flushInterval.unref(); // Allows Node.js to exit if this is the only remaining active timer

                console.log(`[D-01] Decision Audit Logger initialized. Path: ${AUDIT_PATH}`);
            } catch (error) {
                console.error(`[D-01 CRITICAL ERROR] Failed to initialize audit log directory at ${dir}: ${error.message}`);
                throw error; // Propagate critical initialization failure
            }
        })();
        return this.initializationPromise;
    }

    /**
     * @private
     * Handles draining the write queue and performing disk IO in serialized batches.
     */
    async _processQueue() {
        if (!this.initialized || this.isProcessing || this.writeQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        // Take a manageable batch off the queue
        const batch = this.writeQueue.splice(0, BATCH_SIZE);
        
        if (batch.length === 0) {
            this.isProcessing = false;
            return;
        }

        try {
            // Join all entries for a single, efficient append operation
            const dataToWrite = batch.join(''); 
            await fs.appendFile(AUDIT_PATH, dataToWrite, 'utf8');

        } catch (error) {
            // CRITICAL: Disk write failure. Re-queue and alert.
            console.error(`[D-01 CRITICAL WRITE FAIL] Failed to write batch of ${batch.length} audit logs. Re-queuing. Error: ${error.message}`);
            this.writeQueue.unshift(...batch); // Prepend batch back to the queue for retry

        } finally {
            this.isProcessing = false;
            // Schedule the next check immediately if there is more work to do
            if (this.writeQueue.length > 0) {
                // Use setImmediate to yield control and re-schedule the processor
                setImmediate(() => this._processQueue());
            }
        }
    }

    /**
     * Logs a completed OGT decision asynchronously by queuing it.
     * The call resolves instantly, decoupling logging from slow disk IO.
     * @param {object} decisionPayload - Data structure containing OGT outputs.
     * @returns {Promise<void>}
     */
    async logDecision(decisionPayload) {
        // Robustly wait for initialization if not complete
        if (!this.initialized && this.initializationPromise) {
            await this.initializationPromise;
        } else if (!this.initialized) {
             await this.initialize(); // Lazy initialization safety check
        }

        if (!decisionPayload.timestamp) {
            decisionPayload.timestamp = Date.now();
        }
        
        // 1. Convert payload to JSON Lines format (fast synchronous operation)
        const logEntry = JSON.stringify(decisionPayload) + '\n';
        
        // 2. Add to the queue
        this.writeQueue.push(logEntry);

        // 3. Trigger processing if not currently running
        if (!this.isProcessing) {
             // Use setImmediate to schedule IO handling outside the current call stack
             setImmediate(() => this._processQueue());
        }
    }

    /**
     * Mandatory graceful shutdown method. Awaits until the queue is empty.
     * @returns {Promise<void>}
     */
    async flush() {
        this.dispose(); // Stop the periodic safety flush
        console.log(`[D-01] Starting graceful audit log flush (${this.writeQueue.length} pending entries)...`);
        
        // Continuously process queue until empty and the processing cycle completes
        while (this.writeQueue.length > 0 || this.isProcessing) {
            await this._processQueue();
            if (this.writeQueue.length > 0 || this.isProcessing) {
                // Yield briefly to prevent locking the thread completely during intense flushing
                await new Promise(resolve => setTimeout(resolve, 10)); 
            }
        }
        console.log('[D-01] Audit log flush complete.');
    }
    
    /**
     * Cleans up internal timers.
     */
    dispose() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
    }
}

module.exports = DecisionAuditLogger;