/**
 * @file ConstraintAdherenceValidator.js
 * @module GAX/Utilities
 * @description Utility class for validating deployment configurations against established constraints defined in ConstraintTaxonomy.
 * Dependencies handled via KERNEL_SYNERGY_CAPABILITIES.
 */

/**
 * @typedef {Object} ConstraintDefinition
 * @property {string} code - Unique constraint code (e.g., 'CSTR_MAX_BUDGET_USD').
 * @property {string} target_parameter - The field in the configuration being validated.
 * @property {string} severity - The level of impact ('HARD', 'SOFT', 'CRITICAL').
 * @property {string} [check_type] - Defines the type of validation (e.g., 'numerical_limit', 'presence_check').
 * @property {*} [expected_value] - Value required for comparison.
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isMet - True if the constraint is adhered to.
 * @property {(string|null)} [details] - Explanation of the failure, if applicable.
 */

export class ConstraintAdherenceValidator {

    /**
     * Initializes the validator. 
     * Note: Taxonomy must be provided by the caller or loaded via initializeDefaultTaxonomy().
     * @param {Array<ConstraintDefinition>} [taxonomy=[]] - The array of constraints.
     */
    constructor(taxonomy = []) {
        // Ensure taxonomy is an array, handling potential failures.
        let constraints = taxonomy;
        if (!Array.isArray(constraints)) {
            console.error("Constraint taxonomy initialized with invalid structure. Resetting to empty array.");
            constraints = [];
        }

        /** @type {Map<string, ConstraintDefinition>} */
        this.taxonomyMap = new Map(constraints.map(c => [c.code, c]));
    }

    /**
     * Attempts to asynchronously load the default Constraint Taxonomy using the ConfigurationService.
     * @returns {Promise<boolean>} True if loaded successfully.
     */
    async initializeDefaultTaxonomy() {
        if (typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' && KERNEL_SYNERGY_CAPABILITIES.ConfigurationService) {
            try {
                // Assume 'get_config' is the method and 'GAX/ConstraintTaxonomy' is the configuration path/key
                const configData = await KERNEL_SYNERGY_CAPABILITIES.ConfigurationService.execute('get_config', 'GAX/ConstraintTaxonomy');
                if (configData && Array.isArray(configData.constraintTypes)) {
                    this.taxonomyMap = new Map(configData.constraintTypes.map(c => [c.code, c]));
                    return true;
                }
            } catch (e) {
                console.error("Failed to load default ConstraintTaxonomy via ConfigurationService.", e);
            }
        }
        return false;
    }

    /**
     * Checks if a provided configuration payload adheres to a specific set of constraints.
     * @param {Object} configuration - The system configuration (e.g., a planned deployment).
     * @param {Array<string>} requiredConstraintCodes - The specific subset of constraints to validate against (e.g., all HARD constraints).
     * @returns {Promise<Object>} Validation result containing status and list of violations.
     */
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

        return {
            isAdherent: violations.length === 0,
            violations
        };
    }

    /**
     * Retrieves all constraint codes marked as HARD or CRITICAL severity.
     * @returns {Array<string>}
     */
    getHardConstraints() {
        return Array.from(this.taxonomyMap.values())
                     .filter(c => c.severity === 'HARD' || c.severity === 'CRITICAL')
                     .map(c => c.code);
    }
}