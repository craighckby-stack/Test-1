/**
 * Component ID: D-01
 * Decision Audit Logger: Immutably records all OGT adjudication results.
 * Essential for traceability, regulatory compliance, and feeding the
 * post-mortem analysis engine.
 *
 * Refactoring Rationale:
 * 1. Converted synchronous file operations (fs.*Sync) to asynchronous promises (fs/promises) 
 *    to prevent blocking the Node.js event loop, crucial for a high-throughput logging component.
 * 2. Introduced an `initialize()` method to asynchronously handle directory creation, 
 *    ensuring the logger is ready before any write attempts.
 */

const fs = require('fs/promises'); 
const path = require('path');
const AUDIT_PATH = path.join(__dirname, '../../logs/ogt_decisions.jsonl');

class DecisionAuditLogger {
    constructor() {
        this.initialized = false;
        this.initializationPromise = null;
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
                // Use async mkdir with recursive flag
                await fs.mkdir(dir, { recursive: true });
                this.initialized = true;
                console.log(`[D-01] Decision Audit Logger initialized. Path: ${AUDIT_PATH}`);
            } catch (error) {
                console.error(`[D-01 CRITICAL ERROR] Failed to initialize audit log directory at ${dir}: ${error.message}`);
                throw error; // Propagate critical initialization failure
            }
        })();
        return this.initializationPromise;
    }

    /**
     * Logs a completed OGT decision asynchronously.
     * @param {object} decisionPayload - Data structure containing OGT outputs.
     * @param {string} decisionPayload.mutationId - ID of the proposal being judged.
     * @param {number} decisionPayload.actualScore - Score from ATM (Actual).
     * @param {number} decisionPayload.requiredThreshold - Threshold from C-11 (Required).
     * @param {string} decisionPayload.result - 'PASS' or 'FAIL'.
     * @param {string} [decisionPayload.reason] - Detailed failure reason if applicable.
     * @param {number} decisionPayload.timestamp - UTC timestamp of the decision.
     * @returns {Promise<void>}
     */
    async logDecision(decisionPayload) {
        // Robustly wait for initialization if not complete
        if (!this.initialized && this.initializationPromise) {
            await this.initializationPromise;
        } else if (!this.initialized) {
             // Attempt lazy initialization if forgotten by caller
             await this.initialize();
        }

        if (!decisionPayload.timestamp) {
            decisionPayload.timestamp = Date.now();
        }

        const logEntry = JSON.stringify(decisionPayload) + '\n';

        try {
            // Use async appendFile for non-blocking IO
            await fs.appendFile(AUDIT_PATH, logEntry, 'utf8');
        } catch (error) {
            // Report failure without blocking the system
            console.error(`[D-01 WRITE FAIL] Failed to asynchronously write audit log entry for mutation ${decisionPayload.mutationId || 'UNKNOWN'}. Error: ${error.message}`);
        }
    }
}

module.exports = DecisionAuditLogger;
