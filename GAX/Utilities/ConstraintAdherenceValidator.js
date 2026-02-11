async validate(configuration, requiredConstraintCodes) {
    const SERVICE_KEY = 'ConstraintExecutionService';
    const VALIDATION_CONTEXT = '[ConstraintAdherenceValidator]';

    // Helper functions
    const createCriticalViolation = (code, details) => ({
        isAdherent: false,
        violations: [{ code, severity: 'CRITICAL', details }]
    });

    // LOGIC EXTRACTED TO PLUGIN: Standardizes constraint check output into a violation object or null.
    const processConstraintResult = (code, constraintDef, adherenceCheck, error) => {
        // Use destructuring with defaults
        const {
            target_parameter: target = 'N/A',
            severity: defSeverity = 'MAJOR'
        } = constraintDef;

        if (error) {
            return {
                code: `${code}_RUNTIME_ERROR`,
                severity: 'CRITICAL',
                details: `Unexpected execution error during constraint ${code}: ${error.message}`
            };
        }

        if (adherenceCheck?.isMet === false) {
            const failureDetails = adherenceCheck.details || `Adherence rule failed for code: ${code}.`;
            return { code, target, severity: defSeverity, details: failureDetails };
        }

        if (adherenceCheck === undefined || adherenceCheck === null) {
            // Service failure or invalid response
            return {
                code: `${code}_SERVICE_FAIL`,
                target: target,
                severity: 'CRITICAL',
                details: `Service returned an invalid or null response for constraint check: ${code}`
            };
        }

        return null; // Adherent
    };


    // 1. Input Validation
    if (!Array.isArray(requiredConstraintCodes) || requiredConstraintCodes.length === 0) {
        const details = 'Required constraint codes list is invalid (must be a non-empty array).';
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return createCriticalViolation('INPUT_VALIDATION_ERROR', details);
    }
    
    // 2. Synergy Service Access
    const ConstraintExecutionService = (typeof Synergy === 'object' && typeof Synergy.get === 'function') 
        ? Synergy.get(SERVICE_KEY) 
        : null;

    if (!ConstraintExecutionService) {
        const details = `Required synergy service ${SERVICE_KEY} is unavailable.`;
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return createCriticalViolation('KERNEL_SERVICE_UNAVAILABLE', details);
    }

    // 3. Local Dependency Check (Taxonomy Map)
    const { taxonomyMap } = this;
    if (!taxonomyMap || typeof taxonomyMap.get !== 'function') {
        const details = "Local taxonomy map required for constraint definitions is missing or invalid (this.taxonomyMap).";
        console.error(`${VALIDATION_CONTEXT} ${details}`);
        return createCriticalViolation('TAXONOMY_MAP_MISSING', details);
    }

    // 4. Constraint Execution Loop (Parallelized using Promise.all)
    const validationPromises = requiredConstraintCodes.map(async (code) => {
        const constraintDef = taxonomyMap.get(code);

        if (!constraintDef) {
            console.warn(`${VALIDATION_CONTEXT} Constraint code ${code} not found in taxonomy. Skipping adherence check.`);
            return null; // Skip
        }

        let adherenceCheck = null;
        let executionError = null;

        try {
            // Delegating constraint execution
            adherenceCheck = await ConstraintExecutionService.execute('executeConstraintCheck', constraintDef, configuration);
        } catch (error) {
            // Catches unexpected runtime errors during service execution
            console.error(`${VALIDATION_CONTEXT} Unexpected error executing constraint ${code}:`, error);
            executionError = error;
        }
        
        // Use externalized logic to standardize result
        return processConstraintResult(code, constraintDef, adherenceCheck, executionError);
    });

    // Execute all constraints concurrently for performance improvement (IO bound operations)
    const rawResults = await Promise.all(validationPromises);
    
    // Filter out nulls (adherent or skipped constraints)
    const violations = rawResults.filter(result => result !== null);

    return {
        isAdherent: violations.length === 0,
        violations
    };
}