/**
 * Governance Settings Schema Validator (v94.1)
 * Enforces strict bounds and integrity checks on GHM configuration settings.
 */

/**
 * Defines critical constraints for governance parameters.
 * Includes minimum (min) and maximum (max) required values.
 */
const GOVERNANCE_SCHEMA_CONSTRAINTS = {
    GHM_LATENCY_THRESHOLD_MS: { min: 100, max: 5000, type: 'int', description: 'Latency must be fast but not unrealistically low.' },
    GHM_SMOOTHING_ALPHA: { min: 0.05, max: 0.5, type: 'float', description: 'Alpha must be within a stable range to avoid oscillations.' },
    GHM_MINIMUM_READINESS_THRESHOLD: { min: 0.75, max: 1.0, type: 'float', description: 'Readiness must be above 0.75 to activate core protocols.' },
    GHM_MAX_VIOLATIONS_TOLERANCE: { min: 1, max: 10, type: 'int', description: 'Tolerance for minor policy violations.' }
    // Complex structures (like weights) are currently excluded from this simplified structural validation.
};

/**
 * Validates a loaded configuration object against defined constraints.
 * This function should be executed immediately after configuration loading (including remote fetch).
 * @param {object} settings - The finalized GOVERNANCE_SETTINGS object.
 * @throws {Error} If any setting violates its constraints, halting system initialization.
 */
function validateGovernanceSettings(settings) {
    let failedValidations = [];
    
    for (const key in GOVERNANCE_SCHEMA_CONSTRAINTS) {
        const constraint = GOVERNANCE_SCHEMA_CONSTRAINTS[key];
        const value = settings[key];

        if (value === undefined) {
             failedValidations.push(`Missing setting: ${key}`);
             continue;
        }

        if (constraint.min !== undefined && value < constraint.min) {
            failedValidations.push(`[CRITICAL] ${key} (${value}) is below minimum acceptable threshold (${constraint.min}).`);
        }
        if (constraint.max !== undefined && value > constraint.max) {
            failedValidations.push(`[CRITICAL] ${key} (${value}) exceeds maximum acceptable threshold (${constraint.max}).`);
        }
    }

    if (failedValidations.length > 0) {
        const errorMsg = `GHM Configuration Integrity Failure (${failedValidations.length} violations found):\n${failedValidations.join('\n')}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    console.info('[GHM Integrity] Governance settings successfully validated against system constraints.');
    return true;
}

module.exports = {
    validateGovernanceSettings,
    GOVERNANCE_SCHEMA_CONSTRAINTS
};