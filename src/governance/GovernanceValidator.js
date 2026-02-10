/**
 * Governance Settings Schema Validator (v94.1, Refactored)
 * Enforces strict bounds, integrity checks, and type constraints on GHM configuration settings.
 */

/**
 * Defines critical constraints and expected types for governance parameters.
 */
const GHM_GOVERNANCE_SCHEMA = {
    GHM_LATENCY_THRESHOLD_MS: { min: 100, max: 5000, type: 'int', description: 'Latency must be fast but not unrealistically low.' },
    GHM_SMOOTHING_ALPHA: { min: 0.05, max: 0.5, type: 'float', description: 'Alpha must be within a stable range to avoid oscillations.' },
    GHM_MINIMUM_READINESS_THRESHOLD: { min: 0.75, max: 1.0, type: 'float', description: 'Readiness must be above 0.75 to activate core protocols.' },
    GHM_MAX_VIOLATIONS_TOLERANCE: { min: 1, max: 10, type: 'int', description: 'Tolerance for minor policy violations.' }
};

/**
 * Validates a loaded configuration object against defined constraints using the ConstraintValidator plugin.
 * 
 * NOTE: This relies on the global availability or injection of ConstraintValidator.
 * 
 * @param {object} settings - The finalized GOVERNANCE_SETTINGS object.
 * @param {object} [schema=GHM_GOVERNANCE_SCHEMA] - Optional custom schema.
 * @returns {boolean} True if validation passes.
 * @throws {Error} If any setting violates its constraints (critical failure).
 */
function validateGovernanceSettings(settings, schema = GHM_GOVERNANCE_SCHEMA) {
    // Delegate validation to the ConstraintValidator plugin
    const failureReports = ConstraintValidator.validate(settings, schema);

    if (failureReports.length > 0) {
        const detailedFailures = failureReports.map(
            (f, i) => `[${i + 1}] ${f.key} (${f.reason}): ${f.message}`
        ).join('\n');

        const errorMsg = `GHM Configuration Integrity Failure (${failureReports.length} violations found):\n${detailedFailures}`;

        console.error(errorMsg);

        // Throwing a standard Error object but attaching structured violation data for robust systems.
        const err = new Error(errorMsg);
        err.name = 'ConfigurationIntegrityError';
        err.violations = failureReports; // Crucial for programmatic error handling
        throw err;
    }

    console.debug('[GHM Integrity v94.1] Governance settings validated successfully (Type & Bounds enforced).');
    return true;
}

module.exports = {
    validateGovernanceSettings,
    GHM_GOVERNANCE_SCHEMA,
};
