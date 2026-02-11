async validate(configuration, requiredConstraintCodes) {
    if (!Array.isArray(requiredConstraintCodes)) {
        console.error("Validation requires an array of constraint codes.");
        return { isAdherent: false, violations: [{ code: 'INPUT_ERROR', severity: 'CRITICAL', details: 'Required constraint codes list is invalid.' }] };
    }

    const violations = [];
    const ServiceKey = 'ConstraintExecutionService';

    if (typeof KERNEL_SYNERGY_CAPABILITIES === 'undefined' || !KERNEL_SYNERGY_CAPABILITIES[ServiceKey]) {
        console.error(`${ServiceKey} capability is unavailable. Cannot perform validation.`);
        return { isAdherent: false, violations: [{ code: 'KERNEL_ERROR', severity: 'CRITICAL', details: `Required service ${ServiceKey} not found in KERNEL_SYNERGY_CAPABILITIES.` }] };
    }

    const ConstraintExecutionService = KERNEL_SYNERGY_CAPABILITIES[ServiceKey];

    try {
        // Robustness check: Ensure the internal taxonomy map is ready for lookups
        if (!this.taxonomyMap || typeof this.taxonomyMap.get !== 'function') {
             throw new Error("Local taxonomy map required for definitions is missing or invalid.");
        }

        for (const code of requiredConstraintCodes) {
            /** @type {ConstraintDefinition} */
            const constraintDef = this.taxonomyMap.get(code);

            if (!constraintDef) {
                console.warn(`Constraint code ${code} not found in taxonomy. Skipping adherence check.`);
                continue;
            }
            
            // Delegating constraint execution to the capability service
            const adherenceCheck = await ConstraintExecutionService.execute('executeConstraintCheck', constraintDef, configuration);

            if (!adherenceCheck || adherenceCheck.isMet === false) {
                const failureDetails = adherenceCheck 
                    ? (adherenceCheck.details || 'Adherence rule failed.') 
                    : 'Constraint check failed due to underlying service error or unexpected null response.';

                violations.push({
                    code: constraintDef.code,
                    target: constraintDef.target_parameter || 'N/A',
                    severity: constraintDef.severity || 'MAJOR', // Use 'MAJOR' as a clearer default severity
                    details: failureDetails
                });
            }
        }
    } catch (error) {
         // Catches unexpected runtime errors during iteration or capability communication failures
         console.error("A critical unexpected error occurred during constraint validation:", error);
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