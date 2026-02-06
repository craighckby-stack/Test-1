// AEOR: Atomic Execution & Orchestration Registrar (AIA Enforcement Layer v94.1)

const AEOR_STATUS = {
    SUCCESS_COMMITTED: 'SUCCESS_COMMITTED',
    ROLLBACK_MANDATED: 'ROLLBACK_MANDATED',
    C04_ROLLBACK_FORCED: 'C04_ROLLBACK_FORCED',
    MCR_STATE_ERROR: 'MCR_STATE_ERROR',
    REGISTRATION_FAILURE: 'REGISTRATION_FAILURE' 
};

/**
 * AEOR: Atomic Execution & Orchestration Registrar (AIA Enforcement Layer v94.1)
 * Enforces AIA post-P-01 PASS governance by managing atomic state transitions 
 * (MCR lock, C-04 isolated execution, FBA/SEA audit) and triggering attested rollback 
 * guarantees upon failure threshold breach.
 */
class AtomicExecutionOrchestrationRegistrar {
    /**
     * @param {object} dependencies - Structured dependencies injection.
     * @param {MCR} dependencies.mcr - Mutation Commitment Registrar
     * @param {C04} dependencies.c04 - Autogeny Sandbox
     * @param {FBA} dependencies.fba - Feedback Aggregator
     * @param {SEA} dependencies.sea - Systemic Entropy Auditor
     * @param {PolicyEngine} dependencies.policyEngine - Governance rule evaluation
     * @param {TelemetryService} dependencies.telemetry - Auditable logging service (New)
     */
    constructor({ mcr, c04, fba, sea, policyEngine, telemetry }) {
        this.MCR = mcr;        
        this.C04 = c04;        
        this.FBA = fba;        
        this.SEA = sea;        
        this.PolicyEngine = policyEngine;
        this.Telemetry = telemetry;
        this.Status = AEOR_STATUS;
    }

    /** 
     * Stage 4: Registers Commitment and acquires state lock. 
     * @param {string} payloadID - Identifier for the mutation event.
     * @param {string} preMutationStateHash - Cryptographic hash of the current state.
     * @returns {Promise<{success: boolean, status: string|undefined}>}
     */
    async registerCommitment(payloadID, preMutationStateHash) {
        try {
            // 4.1: Log state hash and acquire exclusive lock
            await this.MCR.lockState(preMutationStateHash, payloadID);
            this.Telemetry.info(`AEOR: Lock acquired for ${payloadID}. HASH: ${preMutationStateHash.substring(0, 8)}`);
            
            // 4.2: Prepare C-04 for execution staging
            await this.C04.stageDeployment(payloadID);

            return { success: true, status: this.Status.SUCCESS_COMMITTED };
        } catch (error) {
            this.Telemetry.error(`MCR integrity failure during registration for ${payloadID}.`, { error, payloadID });
            return { success: false, status: this.Status.REGISTRATION_FAILURE };
        }
    }

    /** Helper: Executes the payload within the isolated C-04 environment. */
    async _executeIsolation(deploymentID) {
        try {
            const result = await this.C04.execute(deploymentID);

            if (!result.success) {
                // Internal C-04 failure (e.g., sandbox violation detected mid-run)
                await this._handleForcedRollback(deploymentID, 'C-04 Isolation Failure: Sandbox internal veto.');
                return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
            }
            return { success: true, executionResult: result };

        } catch (error) {
            // External execution hard crash
            this.Telemetry.critical(`AEOR encountered FATAL error during C-04 execution for ${deploymentID}.`, { error });
            await this._handleForcedRollback(deploymentID, 'Fatal Execution Error: Infrastructure crash.');
            return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
        }
    }

    /** Helper: Retrieves metrics, runs SEA/FBA audits, and performs policy check. */
    async _runPostExecutionAudit(deploymentID) {
        this.Telemetry.debug(`AEOR: Starting concurrent post-execution audit for ${deploymentID}.`);

        // Concurrently retrieve potentially heavy metrics/analysis data
        const [metrics, debtAnalysis] = await Promise.all([
            this.FBA.getMetrics(deploymentID),
            this.SEA.analyze(deploymentID)
        ]);

        const evaluationContext = { deploymentID, metrics, debtAnalysis };

        // Evaluate against Governance Rule Source (C-15 logic via Policy Engine)
        const vetoCheck = this.PolicyEngine.checkRollbackVeto(evaluationContext);
        
        if (vetoCheck.veto) {
            this.Telemetry.warn(`AEOR Audit Veto triggered for ${deploymentID}. Reason: ${vetoCheck.reason}`);
            return { 
                mandatedRollback: true, 
                reason: vetoCheck.reason || 'Defined policy threshold breached',
                analysis: evaluationContext
            };
        }

        return { mandatedRollback: false, analysis: evaluationContext };
    }
    
    /** Helper: Commits the mutation and releases the MCR state lock. */
    async _commitMutation(deploymentID, analysis) {
        await this.MCR.commitAndRelease(deploymentID);
        this.Telemetry.info(`AEOR: Mutation committed and lock released for ${deploymentID}.`, analysis);
    }

    /** Helper: Handles the forced rollback path. */
    async _handleForcedRollback(deploymentID, reason) {
        this.Telemetry.critical(`FORCED ROLLBACK initiated for ${deploymentID}. Reason: ${reason}`);
        await this.triggerAtomicRollback(deploymentID, reason);
    }


    /** 
     * Stage 5: Supervises execution and evaluates necessity of atomic rollback. 
     * This is the core orchestration function.
     */
    async superviseExecutionAndAudit(deploymentID) {
        
        // 5.1: Isolation Execution
        const executionResult = await this._executeIsolation(deploymentID);
        if (!executionResult.success) {
            // Rollback already triggered inside _executeIsolation
            return { status: executionResult.status };
        }
        
        // 5.2: Post-Execution Audit
        const auditResult = await this._runPostExecutionAudit(deploymentID);

        if (auditResult.mandatedRollback) {
            await this.triggerAtomicRollback(deploymentID, auditResult.reason);
            return { status: this.Status.ROLLBACK_MANDATED, analysis: auditResult.analysis };
        }

        // 5.3: Commitment and Release
        await this._commitMutation(deploymentID, auditResult.analysis);

        return { status: this.Status.SUCCESS_COMMITTED, analysis: auditResult.analysis };
    }

    /** Initiates the auditable, irreversible atomic rollback sequence. */
    async triggerAtomicRollback(deploymentID, reason) {
        this.Telemetry.warn(`AIA ROLLBACK sequence started for ${deploymentID}. Reason: ${reason}`);
        
        try {
            // 1. Revert state and release lock within MCR
            await this.MCR.reverseAndRelease(deploymentID, reason);
            
            // 2. Instruct C-04 to discard changes and clean environment
            await this.C04.rollback(deploymentID); 

            this.Telemetry.info(`Rollback complete for ${deploymentID}. State integrity restored.`);

        } catch (rollbackError) {
             // If rollback itself fails, this is a catastrophic integrity violation (AEOR Failsafe Breach)
             this.Telemetry.fatal(`CATASTROPHIC FAILURE: Rollback sequence failed for ${deploymentID}. Immediate human intervention required.`, { rollbackError });
             // Note: Depending on system architecture, immediate process halt or emergency signal might be required here.
        }
    }
}