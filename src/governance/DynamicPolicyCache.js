/**
 * Dynamic Policy Cache (DPC) Utility V1
 * Loads ACVD constraints for optimized, low-latency axiomatic checks.
 */

class DynamicPolicyCache {
    constructor(config) {
        if (!config || !config.policy_thresholds || !config.attestation_requirements) {
            throw new Error("DPC initialization requires full ACVD config.");
        }
        this.VetoBounds = config.policy_thresholds.integrity_veto_bounds;
        this.UtilityBounds = config.policy_thresholds.utility_maximization;
        this.ContextRequired = config.attestation_requirements.ecvm_required;
    }

    /**
     * Executes a low-latency check against critical veto bounds (PVLM/MPAM).
     * @param {Object} metrics - Runtime metrics to validate.
     * @returns {boolean} True if the system state is valid and non-vetoable.
     */
    checkIntegrityVeto(metrics) {
        // Given zero tolerance defined in ACVD_V97_3
        if (metrics.pvlm_failure_count > this.VetoBounds.max_pvlm_failures) {
            return false; // PVLM breach
        }
        if (metrics.mpam_failure_count > this.VetoBounds.max_mpam_failures) {
            return false; // MPAM breach
        }
        // (Adherence Timeout Check would be handled separately by the timer loop)
        return true;
    }

    getUFRM() {
        return this.UtilityBounds.UFRM;
    }
}

module.exports = DynamicPolicyCache;