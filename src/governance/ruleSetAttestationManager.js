/**
 * Component ID: RSAM (Rule Set Attestation Manager)
 * Functional Focus: Secure staging, cryptographic attestation, and version control of the Governance Rule Source (GRS).
 * GSEP Alignment: Stage 1 (Vetting Policy Changes), Stage 3 (Providing attested rule state for C-15).
 *
 * RSAM serves as the mandatory integrity gate for all changes proposed to immutable governance policies (GRS). It prevents 
 * the C-15 Policy Engine from referencing a GRS update until the change is cryptographically attested, version-locked,
 * and validated against the current architectural schema by ASR/CIM.
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
        this.telemetry = telemetry; // V94.1 Enhancement: Structured logging
        this.stagingBuffer = new Map(); // Using Map for clearer state management keyed by mutationId
    }

    /**
     * Stages a new governance rule set and performs initial structural vetting asynchronously.
     * Assumes ASR validation is an asynchronous process.
     * @param {object} proposedRuleSet - The new rule set payload.
     * @param {string} mutationId - The ID of the M-01 Intent Package proposing the change.
     * @param {object} sourceMetadata - Contextual data about the change request.
     * @returns {Promise<object>}
     */
    async stagePolicyUpdate(proposedRuleSet, mutationId, sourceMetadata) {
        // 1. Schema Validation
        const validationResult = await this.asr.validatePolicySchema(proposedRuleSet);
        
        if (!validationResult.valid) {
            this.telemetry.critical('RSAM_VETO', {
                mutationId,
                reason: 'Schema validation failure',
                details: validationResult.errors
            });
            return { success: false, reason: 'SCHEMA_INVALID' };
        }

        // 2. Hash Generation
        const ruleHash = await this.ktam.generateAttestationHash(proposedRuleSet);
        const timestamp = Date.now();

        // 3. Staging
        this.stagingBuffer.set(mutationId, { 
            rules: proposedRuleSet, 
            ruleHash: ruleHash, 
            status: 'STAGED', 
            stageTime: timestamp,
            source: sourceMetadata 
        });
        
        this.telemetry.info('RSAM_POLICY_STAGED', { mutationId, ruleHash: ruleHash.substring(0, 16) });
        return { success: true, hash: ruleHash };
    }

    /**
     * Executes cryptographic signing, version-locks the policy set, and triggers GRS activation.
     * @param {string} mutationId
     * @param {string} committingAgentId - ID of the agent that authorized the commit (e.g., EPDP result).
     * @returns {Promise<object|null>} Returns the committed version and attestation metadata.
     */
    async attestAndCommitPolicy(mutationId, committingAgentId) {
        const stage = this.stagingBuffer.get(mutationId);

        if (!stage || stage.status !== 'STAGED') {
            this.telemetry.warn('RSAM_COMMIT_FAIL', { mutationId, reason: 'State mismatch or missing stage entry.' });
            return null;
        }

        // 1. Versioning: Get the next official version from GRS/version register
        const newVersion = await this.grs.proposeNextVersion(stage.ruleHash);

        // 2. Cryptographic Attestation Payload Creation
        const commitmentPayload = {
            dataHash: stage.ruleHash,
            version: newVersion,
            agent: committingAgentId,
            timestamp: Date.now()
        };
        
        // 3. Secure Signing: KTAM generates the verifiable attestation signature
        const attestation = await this.ktam.createCryptographicAttestation(commitmentPayload, 'RSAM_POLICY_LOCK');
        
        // 4. Atomic Activation into the Governance Rule Source (GRS)
        try {
            // GRS ensures that the new rule set is globally accessible and immutably linked to the version/attestation.
            await this.grs.activateNewRuleSet(stage.rules, newVersion, attestation);
        } catch (error) {
            this.telemetry.critical('RSAM_COMMIT_GRS_FAILURE', { mutationId, error: error.message });
            return null; // Fatal failure during activation, requires manual investigation.
        }

        // 5. Cleanup and State Update
        // Note: For full auditability, this state data should move to a separate persistent Audit Log Manager before deletion.
        this.stagingBuffer.delete(mutationId); 

        this.telemetry.success('RSAM_COMMITTED', { mutationId, version: newVersion, attestationId: attestation.signatureId });
        return { version: newVersion, attestation };
    }

    /**
     * Provides the currently attested governance state for C-15 policy checks (S-03 input).
     * @returns {object}
     */
    getCurrentAttestedRules() {
        // This method remains synchronous as it is a direct read from the current GRS state.
        return this.grs.getActiveRuleSet();
    }
}

module.exports = RuleSetAttestationManager;
