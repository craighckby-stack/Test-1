/**
 * Component ID: D-01
 * Decision Audit Logger: Immutably records all OGT adjudication results.
 * Essential for traceability, regulatory compliance, and feeding the
 * post-mortem analysis engine.
 */

const fs = require('fs');
const path = require('path');
const AUDIT_PATH = path.join(__dirname, '../../logs/ogt_decisions.jsonl');

class DecisionAuditLogger {
    constructor() {
        // Ensure the audit log directory exists
        if (!fs.existsSync(path.dirname(AUDIT_PATH))) {
            fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
        }
    }

    /**
     * Logs a completed OGT decision.
     * @param {object} decisionPayload - Data structure containing OGT outputs.
     * @param {string} decisionPayload.mutationId - ID of the proposal being judged.
     * @param {number} decisionPayload.actualScore - Score from ATM (Actual).
     * @param {number} decisionPayload.requiredThreshold - Threshold from C-11 (Required).
     * @param {string} decisionPayload.result - 'PASS' or 'FAIL'.
     * @param {string} [decisionPayload.reason] - Detailed failure reason if applicable.
     * @param {number} decisionPayload.timestamp - UTC timestamp of the decision.
     */
    logDecision(decisionPayload) {
        if (!decisionPayload.timestamp) {
            decisionPayload.timestamp = Date.now();
        }

        const logEntry = JSON.stringify(decisionPayload) + '\n';

        try {
            // Use appendFile for high-throughput, sequential logging (JSONL format)
            fs.appendFileSync(AUDIT_PATH, logEntry);
        } catch (error) {
            console.error(`[D-01 ERROR] Failed to write audit log: ${error.message}`);
            // Implement fail-safe/alert mechanism here if critical
        }
    }

    // Future functionality: retrieval, filtering, and reporting methods
}

module.exports = DecisionAuditLogger;