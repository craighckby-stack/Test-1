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
    constructor(grs, ktam, asr) {
        this.grs = grs; // Governance Rule Source reference
        this.ktam = ktam; // Key & Trust Anchor Manager for signing
        this.asr = asr; // Architectural Schema Registrar for validation
        this.stagingBuffer = {};
    }

    /**
     * Stages a new governance rule set and performs initial structural vetting.
     * @param {object} proposedRuleSet - The new rule set payload.
     * @param {string} mutationId - The ID of the M-01 Intent Package proposing the change.
     * @returns {boolean}
     */
    stagePolicyUpdate(proposedRuleSet, mutationId) {
        if (!this.asr.validatePolicySchema(proposedRuleSet)) {
            console.error('RSAM VETO: Proposed rule set fails schema validation.');
            return false;
        }

        const attestHash = this.ktam.generateAttestationHash(proposedRuleSet);
        this.stagingBuffer[mutationId] = { 
            rules: proposedRuleSet, 
            hash: attestHash, 
            status: 'STAGED' 
        };
        return true;
    }

    /**
     * Executes cryptographic signing and transitions the policy set to be ready for C-15 activation.
     * This step is generally triggered by a successful EPDP B/C approval flow.
     * @param {string} mutationId
     * @returns {string|null} The attested hash upon success.
     */
    attestAndCommitPolicy(mutationId) {
        const stage = this.stagingBuffer[mutationId];
        if (!stage || stage.status !== 'STAGED') {
            console.error('RSAM ERROR: Mutation ID not found or not staged.');
            return null;
        }

        // Simulate cryptographic signing/version-lock using KTAM primitives
        const finalHash = this.ktam.signData(stage.hash, 'RSAM_POLICY_LOCK');
        stage.status = 'COMMITTED';
        this.grs.activateNewRuleSet(stage.rules, finalHash);
        delete this.stagingBuffer[mutationId];
        
        return finalHash;
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
