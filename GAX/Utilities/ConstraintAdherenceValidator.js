async validate(configuration, requiredConstraintCodes) {
    const SERVICE_KEY = 'ConstraintExecutionService';
    const VALIDATION_CONTEXT = '[ConstraintAdherenceValidator]';

    // 1. Input Validation
    if (!Array.isArray(requiredConstraintCodes) || requiredConstraintCodes.length === 0) {
        const details = Array.isArray(requiredConstraintCodes) && requiredConstraintCodes.length === 0 
            ? 'Required constraint codes list is empty.'
            : 'Required constraint codes list is invalid (must be a non-empty array).';
            
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return { 
            isAdherent: false, 
            violations: [{ code: 'INPUT_VALIDATION_ERROR', severity: 'CRITICAL', details }]
        };
    }
    
    // 2. Synergy Registry Access Check (Refactored using Synergy concept)
    if (typeof KERNEL_SYNERGY_CAPABILITIES === 'undefined' || !KERNEL_SYNERGY_CAPABILITIES[SERVICE_KEY]) {
        const details = `Required synergy service ${SERVICE_KEY} is unavailable in KERNEL_SYNERGY_CAPABILITIES.`;
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return { 
            isAdherent: false, 
            violations: [{ code: 'KERNEL_SERVICE_UNAVAILABLE', severity: 'CRITICAL', details }]
        };
    }

    const ConstraintExecutionService = KERNEL_SYNERGY_CAPABILITIES[SERVICE_KEY];
    const violations = [];

    // 3. Local Dependency Check (Taxonomy Map)
    if (!this.taxonomyMap || typeof this.taxonomyMap.get !== 'function') {
        const details = "Local taxonomy map required for constraint definitions is missing or invalid (this.taxonomyMap).";
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return { 
            isAdherent: false, 
            violations: [{ code: 'TAXONOMY_MAP_MISSING', severity: 'CRITICAL', details }]
        };
    }

    try {
        for (const code of requiredConstraintCodes) {
            /** @type {ConstraintDefinition} */
            const constraintDef = this.taxonomyMap.get(code);

            if (!constraintDef) {
                console.warn(`${VALIDATION_CONTEXT} Constraint code ${code} not found in taxonomy. Skipping adherence check.`);
                continue;
            }
            
            // Delegating constraint execution to the capability service
            const adherenceCheck = await ConstraintExecutionService.execute('executeConstraintCheck', constraintDef, configuration);

            if (adherenceCheck?.isMet === false) {
                // Constraint failed
                const failureDetails = adherenceCheck.details || `Adherence rule failed for code: ${code}.`;

                violations.push({
                    code: constraintDef.code,
                    target: constraintDef.target_parameter || 'N/A',
                    severity: constraintDef.severity || 'MAJOR',
                    details: failureDetails
                });
            } else if (!adherenceCheck) {
                // Service returned null/undefined, indicating internal service failure during execution
                 violations.push({
                    code: `${constraintDef.code}_SERVICE_FAIL`,
                    target: constraintDef.target_parameter || 'N/A',
                    severity: 'CRITICAL',
                    details: `Service returned an invalid or null response for constraint check: ${code}`
                });
            }
        }
    } catch (error) {
         // Catches unexpected runtime errors during iteration or capability communication failures
         console.error(`${VALIDATION_CONTEXT} Critical unexpected error during validation loop:`, error);
         violations.push({
            code: 'RUNTIME_EXECUTION_ERROR',
            severity: 'CRITICAL',
            details: `Unexpected error during constraint execution loop: ${error.message}`
        });
    }

    return {
        isAdherent: violations.length === 0,
        violations
    };
}