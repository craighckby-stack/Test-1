    async validate(configuration, requiredConstraintCodes) {
        if (!Array.isArray(requiredConstraintCodes)) {
            console.error("Validation requires an array of constraint codes.");
            return { isAdherent: false, violations: [{ code: 'INPUT_ERROR', severity: 'CRITICAL', details: 'Required constraint codes list is invalid.' }] };
        }

        const violations = [];

        if (typeof KERNEL_SYNERGY_CAPABILITIES === 'undefined' || !KERNEL_SYNERGY_CAPABILITIES.ConstraintExecutionService) {
            console.error("ConstraintExecutionService capability is unavailable. Cannot perform validation.");
            return { isAdherent: false, violations: [{ code: 'KERNEL_ERROR', severity: 'CRITICAL', details: 'Constraint Execution Service required but not found.' }] };
        }

        const ConstraintExecutionService = KERNEL_SYNERGY_CAPABILITIES.ConstraintExecutionService;

        try {
            for (const code of requiredConstraintCodes) {
                /** @type {ConstraintDefinition} */
                const constraintDef = this.taxonomyMap.get(code);

                if (!constraintDef) {
                    console.warn(`Constraint code ${code} not found in taxonomy.`);
                    continue;
                }
                
                // Delegating constraint execution to the capability service
                const adherenceCheck = await ConstraintExecutionService.execute('executeConstraintCheck', constraintDef, configuration);

                if (!adherenceCheck || adherenceCheck.isMet === false) {
                    violations.push({
                        code: constraintDef.code,
                        target: constraintDef.target_parameter || 'N/A',
                        severity: constraintDef.severity || 'UNKNOWN',
                        details: adherenceCheck ? (adherenceCheck.details || 'Adherence rule failed.') : 'Constraint check failed due to service error.'
                    });
                }
            }
        } catch (error) {
             // Catches unexpected runtime errors during iteration or deep capability communication failures
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