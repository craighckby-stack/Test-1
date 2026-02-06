/**
 * PolicyValidationModule (PVM)
 * Checks system actions and proposed decisions against Governance Threshold Configuration Manifest (GTCM) constraints.
 * This module acts as the crucial runtime guardrail.
 */
class PolicyValidationModule {
    constructor(gtcmConfig) {
        if (!gtcmConfig || !gtcmConfig.constraints) {
            throw new Error("PVM initialization requires valid GTCM constraints structure.");
        }
        this.constraints = gtcmConfig.constraints;
    }

    /**
     * Evaluates a set of runtime metrics against all defined GTCM constraints.
     * @param {object} metrics - Runtime metrics to evaluate (e.g., { utility: 0.70, exposure: 0.15, stability_ratio: 3.5 })
     * @returns {boolean} True if compliant, false otherwise.
     */
    isCompliant(metrics) {
        const T = this.constraints.THRESHOLD;
        const L = this.constraints.LIMIT;

        // 1. Check Thresholds (Required Metrics MUST meet or exceed the minimum value)
        if (metrics.utility < T.operational_utility_min.value) {
            console.warn(`[PVM Breach] Utility (${metrics.utility}) is below minimum required threshold (${T.operational_utility_min.value}).`);
            return false;
        }
        if (metrics.stability_ratio < T.stability_ratio_min.value) {
            console.warn(`[PVM Breach] Stability Ratio (${metrics.stability_ratio}) is below minimum required threshold (${T.stability_ratio_min.value}).`);
            return false;
        }

        // 2. Check Limits (System parameters MUST NOT exceed the maximum value)
        if (metrics.exposure > L.systemic_exposure_max.value) {
            console.warn(`[PVM Breach] Systemic Exposure (${metrics.exposure}) exceeds maximum allowed limit (${L.systemic_exposure_max.value}).`);
            return false;
        }

        // NOTE: Additional checks for ARBITRATION thresholds would be implemented here, 
        // often involving historical context or deltas, which are metrics driven rather than static checks.
        
        return true;
    }

    getConstraintDefinition(type, key) {
        return this.constraints[type] ? this.constraints[type][key] : null;
    }
}

module.exports = PolicyValidationModule;
