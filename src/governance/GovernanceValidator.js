/**
 * Governance Settings Schema Validator (v94.1)
 * Enforces strict bounds, integrity checks, and type constraints on GHM configuration settings.
 */

// --- Type Checker Utilities ---
const TypeCheckers = {
    /** Checks if a value is a strict integer. */
    int: (value) => typeof value === 'number' && Number.isInteger(value),
    /** Checks if a value is a standard JavaScript number (float or int). */
    float: (value) => typeof value === 'number' && isFinite(value),
};

/**
 * Defines critical constraints and expected types for governance parameters.
 * Replaces GOVERNANCE_SCHEMA_CONSTRAINTS.
 */
const GHM_GOVERNANCE_SCHEMA = {
    GHM_LATENCY_THRESHOLD_MS: { min: 100, max: 5000, type: 'int', description: 'Latency must be fast but not unrealistically low.' },
    GHM_SMOOTHING_ALPHA: { min: 0.05, max: 0.5, type: 'float', description: 'Alpha must be within a stable range to avoid oscillations.' },
    GHM_MINIMUM_READINESS_THRESHOLD: { min: 0.75, max: 1.0, type: 'float', description: 'Readiness must be above 0.75 to activate core protocols.' },
    GHM_MAX_VIOLATIONS_TOLERANCE: { min: 1, max: 10, type: 'int', description: 'Tolerance for minor policy violations.' }
};

/**
 * Helper function to enforce type constraints.
 * @param {*} value - The setting value.
 * @param {string} expectedType - 'int' or 'float'.
 * @returns {boolean} True if type matches, false otherwise.
 */
function _validateType(value, expectedType) {
    const checker = TypeCheckers[expectedType];
    if (checker) {
        return checker(value);
    }
    // If schema defines a type without a checker, we skip validation for robustness.
    return true; 
}


/**
 * Validates a loaded configuration object against defined constraints.
 * This function should be executed immediately after configuration loading.
 * @param {object} settings - The finalized GOVERNANCE_SETTINGS object.
 * @returns {boolean} True if validation passes.
 * @throws {Error} If any setting violates its constraints (critical failure).
 */
function validateGovernanceSettings(settings) {
    let failureReports = [];
    
    for (const key in GHM_GOVERNANCE_SCHEMA) {
        const constraint = GHM_GOVERNANCE_SCHEMA[key];
        const value = settings[key];

        // 1. Existence Check
        if (value === undefined || value === null) {
             failureReports.push({ key, reason: 'MISSING', message: `Setting is required but missing or null.` });
             continue;
        }

        // 2. Type Check (Utilizing the defined 'type' field)
        if (!_validateType(value, constraint.type)) {
            failureReports.push({ key, reason: 'TYPE_MISMATCH', message: `Expected type '${constraint.type}', received value '${value}' (${typeof value}).` });
        }

        // 3. Bounds Check (Only proceed if value is numeric, ensuring comparison safety)
        if (typeof value === 'number') {
            if (constraint.min !== undefined && value < constraint.min) {
                failureReports.push({ key, reason: 'BELOW_MIN', message: `Value (${value}) is below minimum acceptable threshold (${constraint.min}).` });
            }
            if (constraint.max !== undefined && value > constraint.max) {
                failureReports.push({ key, reason: 'EXCEEDS_MAX', message: `Value (${value}) exceeds maximum acceptable threshold (${constraint.max}).` });
            }
        }
    }

    if (failureReports.length > 0) {
        // Structured error reporting for debugging
        const detailedFailures = failureReports.map(
            (f, i) => `[${i + 1}] ${f.key} (${f.reason}): ${f.message}`
        ).join('\n');
        
        const errorMsg = `GHM Configuration Integrity Failure (${failureReports.length} violations found):\n${detailedFailures}`;
        
        // Critical system halt due to configuration integrity failure
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    console.info('[GHM Integrity v94.1] Governance settings successfully validated (Existence, Type, Bounds).');
    return true;
}

module.exports = {
    validateGovernanceSettings,
    GHM_GOVERNANCE_SCHEMA
};