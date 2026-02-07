/**
 * Component ID: RSAM (Rule Set Attestation Manager)
 * Optimization Directive: Maximum computational efficiency and recursive abstraction.
 * Refactoring Focus: Concurrent processing for staging and functional pipeline decomposition for commitment.
 */
class RuleSetAttestationManager {
    /**
     * @param {object} grs - Governance Rule Source reference
     * @param {object} ktam - Key & Trust Anchor Manager for signing
     * @param {object} asr - Architectural Schema Registrar for validation
     * @param {object} telemetry - Structured logging/monitoring system
     */
    constructor(grs, ktam, asr, telemetry) {
        this.grs = grs;
        this.ktam = ktam;
        this.asr = asr;
        this.telemetry = telemetry;
        // O(1) state management optimized for lookup
        this.stagingBuffer = new Map(); 
    }

    /**
     * Core utility: Performs concurrent schema validation and cryptographic hashing.
     * This maximizes throughput by overlapping potential I/O (ASR) with CPU work (KTAM hashing).
     * @param {object} proposedRuleSet
     * @returns {Promise<{ruleHash: string, validationResult: object}>}
     * @private
     */
    async _validateAndHash(proposedRuleSet) {
        // 1. Concurrent Execution: Validate and Hash run simultaneously
        const [validationResult, ruleHash] = await Promise.all([
            this.asr.validatePolicySchema(proposedRuleSet),
            this.ktam.generateAttestationHash(proposedRuleSet)
        ]);
        
        if (!validationResult.valid) {
            // Throw structured error for caller to handle telemetry
            const err = new Error('SCHEMA_INVALID');
            err.details = validationResult.errors;
            throw err;
        }

        return { ruleHash, validationResult };
    }

    /**
     * Stages a new governance rule set and performs initial structural vetting asynchronously.
     * @returns {Promise<object>}
     */
    async stagePolicyUpdate(proposedRuleSet, mutationId, sourceMetadata) {
        try {
            const { ruleHash } = await this._validateAndHash(proposedRuleSet);
            const timestamp = Date.now();

            // 2. Atomic Staging
            this.stagingBuffer.set(mutationId, { 
                rules: proposedRuleSet, 
                ruleHash: ruleHash, 
                status: 'STAGED', 
                stageTime: timestamp,
                source: sourceMetadata 
            });
            
            this.telemetry.info('RSAM_POLICY_STAGED', { mutationId, ruleHash: ruleHash.substring(0, 16) });
            return { success: true, hash: ruleHash };

        } catch (e) {
            if (e.message === 'SCHEMA_INVALID') {
                this.telemetry.critical('RSAM_VETO', { mutationId, reason: 'Schema validation failure', details: e.details });
                return { success: false, reason: 'SCHEMA_INVALID' };
            }
            // Re-throw unexpected system errors (e.g., hash generation failure)
            throw e;
        }
    }

    /**
     * Recursively abstracted commitment pipeline: Versioning -> Signing -> Activation.
     * Ensures strict sequential dependencies are met efficiently.
     * @private
     */
    async _processCommitmentPipeline(stage, committingAgentId) {
        // 1. Versioning
        const newVersion = await this.grs.proposeNextVersion(stage.ruleHash);

        // 2. Cryptographic Attestation Payload Creation
        const commitmentPayload = {
            dataHash: stage.ruleHash,
            version: newVersion,
            agent: committingAgentId,
            timestamp: Date.now()
        };
        
        // 3. Secure Signing (Attestation)
        const attestation = await this.ktam.createCryptographicAttestation(commitmentPayload, 'RSAM_POLICY_LOCK');
        
        // 4. Atomic Activation into the GRS
        await this.grs.activateNewRuleSet(stage.rules, newVersion, attestation);

        return { version: newVersion, attestation };
    }

    /**
     * Executes cryptographic signing, version-locks the policy set, and triggers GRS activation.
     * @returns {Promise<object|null>}
     */
    async attestAndCommitPolicy(mutationId, committingAgentId) {
        const stage = this.stagingBuffer.get(mutationId);

        if (!stage || stage.status !== 'STAGED') {
            this.telemetry.warn('RSAM_COMMIT_FAIL', { mutationId, reason: 'State mismatch or missing stage entry.' });
            return null;
        }

        try {
            const result = await this._processCommitmentPipeline(stage, committingAgentId);

            // 5. Cleanup and Telemetry
            this.stagingBuffer.delete(mutationId); 
            this.telemetry.success('RSAM_COMMITTED', { mutationId, version: result.version, attestationId: result.attestation.signatureId });
            return result;

        } catch (error) {
            this.telemetry.critical('RSAM_COMMIT_GRS_FAILURE', { mutationId, error: error.message, stack: error.stack });
            // Note: If activation fails, the stage remains for forensic audit.
            return null; 
        }
    }

    /**
     * Provides the currently attested governance state for C-15 policy checks (S-03 input).
     * @returns {object}
     */
    getCurrentAttestedRules() {
        return this.grs.getActiveRuleSet();
    }
}

module.exports = RuleSetAttestationManager;