async validate(configuration, requiredConstraintCodes) {
    const SERVICE_KEY = 'ConstraintExecutionService';
    const VALIDATION_CONTEXT = '[ConstraintAdherenceValidator]';

    // Helper function for quick critical failure returns
    const createCriticalViolation = (code, details) => ({
        isAdherent: false,
        violations: [{ code, severity: 'CRITICAL', details }]
    });

    // 1. Input Validation
    if (!Array.isArray(requiredConstraintCodes) || requiredConstraintCodes.length === 0) {
        const details = Array.isArray(requiredConstraintCodes) && requiredConstraintCodes.length === 0 
            ? 'Required constraint codes list is empty.'
            : 'Required constraint codes list is invalid (must be a non-empty array).';
            
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return createCriticalViolation('INPUT_VALIDATION_ERROR', details);
    }
    
    // 2. Synergy Service Access
    const ConstraintExecutionService = (typeof Synergy === 'object' && typeof Synergy.get === 'function') 
        ? Synergy.get(SERVICE_KEY) 
        : null;

    if (!ConstraintExecutionService) {
        const details = `Required synergy service ${SERVICE_KEY} is unavailable. Synergy Registry access failed or service not found.`;
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return createCriticalViolation('KERNEL_SERVICE_UNAVAILABLE', details);
    }

    // 3. Local Dependency Check (Taxonomy Map)
    const { taxonomyMap } = this; // Use destructuring for cleaner access
    if (!taxonomyMap || typeof taxonomyMap.get !== 'function') {
        const details = "Local taxonomy map required for constraint definitions is missing or invalid (this.taxonomyMap).";
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return createCriticalViolation('TAXONOMY_MAP_MISSING', details);
    }

    const violations = [];

    // 4. Constraint Execution Loop
    for (const code of requiredConstraintCodes) {
        try {
            /** @type {ConstraintDefinition} */
            const constraintDef = taxonomyMap.get(code);

            if (!constraintDef) {
                console.warn(`${VALIDATION_CONTEXT} Constraint code ${code} not found in taxonomy. Skipping adherence check.`);
                continue;
            }
            
            // Destructuring definition properties with defaults
            const {
                code: defCode,
                target_parameter: target = 'N/A',
                severity: defSeverity = 'MAJOR'
            } = constraintDef;

            // Delegating constraint execution
            const adherenceCheck = await ConstraintExecutionService.execute('executeConstraintCheck', constraintDef, configuration);

            if (adherenceCheck?.isMet === false) {
                // Constraint failed
                const failureDetails = adherenceCheck.details || `Adherence rule failed for code: ${defCode}.`;

                violations.push({
                    code: defCode,
                    target: target,
                    severity: defSeverity,
                    details: failureDetails
                });
            } else if (!adherenceCheck) {
                // Service returned null/undefined, indicating internal service failure
                 violations.push({
                    code: `${defCode}_SERVICE_FAIL`,
                    target: target,
                    severity: 'CRITICAL',
                    details: `Service returned an invalid or null response for constraint check: ${defCode}`
                });
            }
        } catch (error) {
             // Catches unexpected runtime errors during execution of *this specific* constraint, ensuring subsequent constraints can still run.
             console.error(`${VALIDATION_CONTEXT} Unexpected error executing constraint ${code}:`, error);
             violations.push({
                code: `${code}_RUNTIME_ERROR`,
                severity: 'CRITICAL',
                details: `Unexpected execution error during constraint ${code}: ${error.message}`
            });
        }
    }

    return {
        isAdherent: violations.length === 0,
        violations
    };
}