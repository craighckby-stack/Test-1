// AEOR: Atomic Execution & Orchestration Registrar (AIA Enforcement Layer)

const AEOR_STATUS = {
    SUCCESS_COMMITTED: 'SUCCESS_COMMITTED',
    ROLLBACK_MANDATED: 'ROLLBACK_MANDATED',
    C04_ROLLBACK_FORCED: 'C04_ROLLBACK_FORCED',
    MCR_STATE_ERROR: 'MCR_STATE_ERROR'
};

/**
 * The AEOR is the governance component responsible for enforcing the AIA post-P-01 PASS.
 * It coordinates the state lock (MCR), supervises isolated execution (C-04), and critically,
 * holds the mandated logic to assess post-deployment metrics (FBA/SEA) against defined
 * Failure Thresholds. If thresholds are breached, AEOR triggers and cryptographically attests
 * the Atomic Rollback Guarantee, ensuring irreversible mutation guarantees are upheld even in failure.
 */
class AtomicExecutionOrchestrationRegistrar {
    constructor(mcr, c04, fba, sea, policyEngine) {
        this.MCR = mcr;        // Mutation Commitment Registrar
        this.C04 = c04;        // Autogeny Sandbox
        this.FBA = fba;        // Feedback Aggregator
        this.SEA = sea;        // Systemic Entropy Auditor
        this.PolicyEngine = policyEngine;
        this.Status = AEOR_STATUS;
    }

    /** Stage 4: Registers Commitment and Stages Payload (Now async for robustness). */
    async registerCommitment(payloadID, preMutationStateHash) {
        try {
            // Step 4.1: Log state hash and acquire exclusive lock
            await this.MCR.lockState(preMutationStateHash, payloadID);
            
            // Step 4.2: Prepare C-04 for execution staging
            await this.C04.stageDeployment(payloadID);

            return { success: true, payloadID };
        } catch (error) {
            console.error(`AEOR Failed to register commitment for ${payloadID}. MCR integrity failure suspected.`, error);
            return { success: false, status: this.Status.MCR_STATE_ERROR };
        }
    }

    /** Helper: Executes the payload within the isolated C-04 environment. */
    async _executeIsolation(deploymentID) {
        try {
            const result = await this.C04.execute(deploymentID);

            if (!result.success) {
                await this.triggerAtomicRollback(deploymentID, 'C-04 Isolation Failure');
                return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
            }
            return { success: true, executionResult: result };

        } catch (error) {
            console.error(`AEOR encountered hard error during C-04 execution for ${deploymentID}.`, error);
            await this.triggerAtomicRollback(deploymentID, 'Fatal Execution Error');
            return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
        }
    }

    /** Helper: Retrieves metrics, runs SEA/FBA audits, and performs policy check. */
    async _runPostExecutionAudit(deploymentID) {
        // Concurrently retrieve potentially heavy metrics/analysis data
        const [metrics, debtAnalysis] = await Promise.all([
            this.FBA.getMetrics(deploymentID),
            this.SEA.analyze(deploymentID)
        ]);

        // Evaluate against Governance Rule Source (C-15 logic via Policy Engine)
        const vetoCheck = this.PolicyEngine.checkRollbackVeto(metrics, debtAnalysis);
        
        if (vetoCheck.veto) {
            return { 
                mandatedRollback: true, 
                reason: vetoCheck.reason || 'Defined policy threshold breached',
                analysis: { metrics, debtAnalysis }
            };
        }

        return { mandatedRollback: false, analysis: { metrics, debtAnalysis } };
    }
    
    /** Helper: Commits the mutation and releases the MCR state lock. */
    async _commitMutation(deploymentID) {
        // Finalize state change and attest commitment (D-01 logging assumed)
        await this.MCR.commitAndRelease(deploymentID);
    }


    /** Stage 5: Supervises execution and evaluates necessity of atomic rollback. */
    async superviseExecutionAndAudit(deploymentID) {
        
        // 5.1: Isolation Execution
        const executionResult = await this._executeIsolation(deploymentID);
        if (!executionResult.success) {
            return { status: executionResult.status };
        }
        
        // 5.2: Post-Execution Audit
        const auditResult = await this._runPostExecutionAudit(deploymentID);

        if (auditResult.mandatedRollback) {
            await this.triggerAtomicRollback(deploymentID, auditResult.reason);
            return { status: this.Status.ROLLBACK_MANDATED, analysis: auditResult.analysis };
        }

        // 5.3: Commitment and Release
        await this._commitMutation(deploymentID);

        return { status: this.Status.SUCCESS_COMMITTED, analysis: auditResult.analysis };
    }

    /** Initiates the auditable, irreversible atomic rollback sequence. */
    async triggerAtomicRollback(deploymentID, reason) {
        console.warn(`AIA ROLLBACK TRIGGERED for ${deploymentID}. Reason: ${reason}`);
        
        // 1. Revert state and release lock within MCR
        await this.MCR.reverseAndRelease(deploymentID, reason);
        
        // 2. Instruct C-04 to discard changes and clean environment
        await this.C04.rollback(deploymentID); 
    }
}