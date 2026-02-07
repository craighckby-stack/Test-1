/**
 * Component ID: D-01 (Decision Audit Logger)
 * Decision Audit Logger: Asynchronously and immutably records all OGT adjudication results 
 * using a buffered, batched, and serialized disk write queue (JSON Lines format).
 *
 * Refactoring Rationale (Sovereign AGI v94.1):
 * 1. Improved `flush()` Mechanism (Graceful Shutdown): Replaced arbitrary iteration limits and `setTimeout(5)` polling with a robust time-based timeout (`maxFlushTimeoutMs`) and explicit event loop yielding (`setImmediate`) for cleaner asynchronous waiting.
 * 2. Synchronous Logging Path: Refactored `logDecision` to be non-async, minimizing call overhead and strictly adhering to the principle of instant queuing decoupled from disk IO, provided initialization is complete.
 * 3. Decoupled Failure Recovery: Modified `_processQueue` to only schedule the next processing cycle immediately upon *successful* batch writes. Failures now rely solely on the configured `flushInterval` or new log entries, preventing rapid, continuous failure spinning on disk errors.
 * 4. Configurability: Added `maxFlushTimeoutMs` to default configurations.
 */

const fs = require('fs/promises');
const path = require('path');

// Sensible defaults for independent operation, configurable via constructor
const DEFAULT_CONFIG = {
    logDir: path.join(__dirname, '../../logs'),
    fileName: 'ogt_decisions.jsonl',
    batchSize: 50,
    flushIntervalMs: 5000,
    maxRetries: 3, // Maximum consecutive attempts before discarding a batch on write failure
    maxFlushTimeoutMs: 30000 // 30 seconds limit for graceful shutdown
};

class DecisionAuditLogger {
    /**
     * @param {object} config - Configuration options (e.g., logDir, batchSize).
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.auditPath = path.join(this.config.logDir, this.config.fileName);
        
        this.initialized = false;
        this.initializationPromise = null;
        this.writeQueue = [];
        this.isProcessing = false;
        this.flushInterval = null;
        this.consecutiveFailures = 0;
    }

    /**
     * Ensures the log directory exists and prepares the logger. Must be awaited once.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            const dir = path.dirname(this.auditPath);
            try {
                await fs.mkdir(dir, { recursive: true });
                this.initialized = true;
                
                // Start safety interval
                this.flushInterval = setInterval(() => this._processQueue(), this.config.flushIntervalMs);
                this.flushInterval.unref(); // Allows the process to exit if only this timer is pending

                console.log(`[D-01] Decision Audit Logger initialized. Path: ${this.auditPath}`);
            } catch (error) {
                console.error(`[D-01 CRITICAL ERROR] Failed to initialize audit log directory at ${dir}: ${error.message}`);
                this.initialized = false; // Ensure state reflects failure
                throw error;
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
        
        // Take a non-destructive batch read off the queue
        const batch = this.writeQueue.slice(0, this.config.batchSize);
        
        if (batch.length === 0) {
            this.isProcessing = false;
            return;
        }

        try {
            const dataToWrite = batch.join(''); 
            await fs.appendFile(this.auditPath, dataToWrite, 'utf8');

            // Success: Remove the written batch from the queue and reset failure counter
            this.writeQueue.splice(0, batch.length);
            this.consecutiveFailures = 0;

            // Trigger immediate subsequent process if there's more queue work (fast drain)
            if (this.writeQueue.length > 0) {
                 setImmediate(() => this._processQueue());
            }

        } catch (error) {
            this.consecutiveFailures++;
            console.error(`[D-01 CRITICAL WRITE FAIL] Attempt ${this.consecutiveFailures}. Failed batch of ${batch.length} logs (Q=${this.writeQueue.length}). Error: ${error.message}`);
            
            // Retry limit check: If failure persists, drop the data to maintain system stability.
            if (this.consecutiveFailures >= this.config.maxRetries) {
                console.warn(`[D-01 DATA LOSS ALERT] Max retries (${this.config.maxRetries}) hit. Discarding ${batch.length} log entries to unblock queue.`);
                this.writeQueue.splice(0, batch.length); // Discard failed batch
                this.consecutiveFailures = 0; // Reset after forced discard
                // Since the queue was modified, check if we need to continue immediately
                if (this.writeQueue.length > 0) {
                    setImmediate(() => this._processQueue());
                }
            } 
            // If retries remain, the queue remains blocked; waiting for the interval (flushIntervalMs) to attempt retry.
            
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Logs a completed OGT decision asynchronously by queuing it.
     * The call is synchronous (non-async) once initialized.
     * @param {object} decisionPayload - Data structure containing OGT outputs.
     * @returns {void}
     */
    logDecision(decisionPayload) {
        if (!this.initialized && !this.initializationPromise) {
            // If not initialized and no init process is running, warn about dependency failure
            console.warn("[D-01] Decision logged before initialization started. Payload queued but IO trigger skipped. Call initialize() first.");
        }
        // We still queue the entry even if not initialized, relying on the periodic interval or later initialization to flush it.

        if (!decisionPayload.timestamp) {
            decisionPayload.timestamp = Date.now();
        }
        
        // 1. Convert payload to JSON Lines format (fast synchronous operation)
        const logEntry = JSON.stringify(decisionPayload) + '\n';
        
        // 2. Add to the queue
        this.writeQueue.push(logEntry);

        // 3. Trigger processing if initialized and not currently running
        if (this.initialized && !this.isProcessing) {
             // Use setImmediate to schedule IO handling outside the current call stack
             setImmediate(() => this._processQueue());
        }
    }

    /**
     * Mandatory graceful shutdown method. Awaits until the queue is empty or timeout hits.
     * @returns {Promise<void>}
     */
    async flush() {
        this.dispose(); // Stop the periodic safety flush
        
        const pendingCount = this.writeQueue.length;
        if (pendingCount === 0) {
            console.log('[D-01] Audit log queue already empty.');
            return;
        }

        console.log(`[D-01] Starting graceful audit log flush (${pendingCount} pending entries)...`);
        
        const startTime = Date.now();

        // Continuously process queue until empty or timeout is hit
        while (this.writeQueue.length > 0 || this.isProcessing) {
            
            if (Date.now() - startTime > this.config.maxFlushTimeoutMs) {
                console.error(`[D-01 CRITICAL FLUSH TIMEOUT] Flush operation timed out after ${this.config.maxFlushTimeoutMs}ms. ${this.writeQueue.length} entries remain. Data potentially lost.`);
                break;
            }

            // Manually trigger the queue processing cycle.
            await this._processQueue();

            // Explicit yield control to the event loop using setImmediate (prevents tight spinning and allows IO events to fire).
            if (this.writeQueue.length > 0 || this.isProcessing) {
                await new Promise(resolve => setImmediate(resolve));
            }
        }
        
        if (this.writeQueue.length > 0) {
             console.error(`[D-01 DATA LOSS ALERT] Failed to empty queue during flush. ${this.writeQueue.length} entries remain.`);
        } else {
            console.log('[D-01] Audit log flush complete.');
        }
    }
    
    /**
     * Cleans up internal timers.
     */
    dispose() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
            console.log('[D-01] Safety flush interval disabled.');
        }
    }
}

module.exports = DecisionAuditLogger;