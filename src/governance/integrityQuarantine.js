// src/governance/integrityQuarantine.js
/**
 * Role: Post-Execution Integrity and Quarantine Enforcement (PEIQ)
 * Monitors post-execution metrics from FBA and triggers mandatory auditing/quarantine
 * if calculated risk exceeds the operational threshold.
 */

class IntegrityQuarantine {
    /**
     * @param {object} dependencies - Core system dependencies.
     * @param {object} dependencies.auditLogger - The Decision Audit Logger instance.
     * @param {object} dependencies.fba - The Feedback Loop Aggregator instance.
     * @param {object} dependencies.artifactArchiver - A robust utility for moving/copying payloads.
     * @param {number} failureThreshold - Threshold derived from risk parameters (e.g., 0.8).
     * @param {string} quarantinePath - Archive location for failed payloads.
     */
    constructor({ auditLogger, fba, artifactArchiver }, failureThreshold, quarantinePath) {
        if (!auditLogger || !fba || !artifactArchiver) {
            throw new Error("IntegrityQuarantine requires auditLogger, fba, and artifactArchiver dependencies.");
        }
        
        this.auditLogger = auditLogger;
        this.fba = fba;
        this.artifactArchiver = artifactArchiver;
        this.failureThreshold = failureThreshold;
        this.quarantinePath = quarantinePath;
    }

    /**
     * @async
     * Evaluates FBA metrics post-C-04 execution and enforces quarantine if integrity is compromised.
     * @param {string} proposalId - The ID of the currently executed architectural payload (A-01 artifact).
     * @param {object} executionMetrics - Data provided by FBA on stability/performance/risk vectors.
     * @returns {Promise<boolean>} True if post-execution integrity holds, false if quarantine is triggered.
     */
    async monitor(proposalId, executionMetrics) {
        // 1. Calculate aggregated failure risk, potentially involving complex aggregation or async operations
        const aggregateRisk = await this.fba.calculatePostExecutionRisk(executionMetrics);

        if (aggregateRisk > this.failureThreshold) {
            
            console.warn(`PEIQ ALERT [Risk Breach]: Proposal ID ${proposalId}. Risk: ${aggregateRisk.toFixed(4)} exceeds threshold: ${this.failureThreshold.toFixed(4)}.`);
            
            // 2. Trigger mandatory audit log
            const auditEntry = {
                proposalId,
                type: 'INTEGRITY_BREACH',
                status: 'QUARANTINED_FAILURE',
                riskScore: aggregateRisk,
                context: executionMetrics, // Capture full context for debugging
                timestamp: new Date().toISOString()
            };
            await this.auditLogger.logFailure(auditEntry);

            // 3. Move the failed payload (A-01 artifact) to quarantine
            await this._enforceQuarantine(proposalId);

            // 4. Signal failure
            return false;
        }

        return true;
    }

    /**
     * Archives the failed artifact payload using the dedicated archiver utility.
     * @private
     * @param {string} proposalId 
     * @returns {Promise<void>}
     */
    async _enforceQuarantine(proposalId) {
        try {
            await this.artifactArchiver.archiveArtifact(proposalId, this.quarantinePath);
            console.log(`[Archive Success] Payload ${proposalId} secured in quarantine: ${this.quarantinePath}`);
        } catch (error) {
            // CRITICAL: Ensure this failure is highly visible. Archival compromise means data loss potential.
            console.error(`CRITICAL ARCHIVE FAILURE: Failed to move proposal ${proposalId} to quarantine.`, error.message);
        }
    }
}

module.exports = IntegrityQuarantine;