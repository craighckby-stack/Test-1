/**
 * Role: State Reversion & Damage Control
 * Listens for high-priority integrity alerts (e.g., from IntegrityQuarantine)
 * and orchestrates necessary steps to revert system state to the last known
 * stable commit (LSC) or neutral boundary state, essential when a failed artifact
 * has already caused partial state pollution (e.g., database writes, file system changes).
 */
class SystemRollbackCoordinator {
    /**
     * @param {object} dependencies
     * @param {object} dependencies.stateManager - Access to global system state definitions and reversion utilities.
     * @param {object} dependencies.systemLogger - General system operation logger.
     * @param {object} dependencies.idempotencyGuard - Tool for ensuring only one operation runs per unique ID.
     */
    constructor({ stateManager, systemLogger, idempotencyGuard }) {
        this.stateManager = stateManager;
        this.systemLogger = systemLogger;
        this.idempotencyGuard = idempotencyGuard; 
    }

    /**
     * Initiates a mandatory rollback sequence based on a critical integrity failure.
     * This should be called immediately after IntegrityQuarantine signals a breach.
     * @param {string} proposalId - The failed artifact ID.
     * @param {object} failureContext - Details surrounding the integrity breach and impacted resources.
     * @returns {Promise<boolean>} True if rollback was successfully initiated or completed.
     */
    async initiateRollback(proposalId, failureContext) {
        // Use the IdempotencyGuard to ensure only one rollback runs concurrently for this proposalId
        if (!this.idempotencyGuard.acquire(proposalId)) {
            this.systemLogger.warn(`Rollback already in progress for ${proposalId}. Skipping initiation.`);
            return true;
        }

        this.systemLogger.critical(`[ROLLBACK REQUIRED] Initiating state reversion due to integrity failure: ${proposalId}`);

        try {
            // 1. Analyze the scope of changes introduced by the failed proposal
            const scope = await this.stateManager.analyzeImpact(proposalId, failureContext);
            
            // 2. Execute reversion sequence (e.g., revert DB transactions, restore configurations)
            const success = await this.stateManager.revertToLastStableState(scope);

            if (success) {
                this.systemLogger.info(`Rollback complete for ${proposalId}. System returned to a known stable state.`);
                return true;
            } else {
                this.systemLogger.error(`Partial or failed rollback for ${proposalId}. Escalation required.`);
                // Future step: Trigger immediate external alert/human intervention protocol
                return false;
            }

        } catch (error) {
            this.systemLogger.fatal(`Unrecoverable error during rollback coordination for ${proposalId}: ${error.message}`);
            return false;
        } finally {
            // Release the lock regardless of outcome
            this.idempotencyGuard.release(proposalId);
        }
    }
}

module.exports = SystemRollbackCoordinator;