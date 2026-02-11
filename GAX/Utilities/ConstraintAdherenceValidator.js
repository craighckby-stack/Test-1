/**
 * @file ConstraintAdherenceValidator.js
 * @module GAX/Utilities
 * @description Utility class for validating deployment configurations against established constraints defined in ConstraintTaxonomy.
 */

import { ConstraintTaxonomy } from './schema/GAX/ConstraintTaxonomy.schema.json'; // Assuming JSON loading capability
import { executeConstraintCheck } from './ConstraintExecutionCapability';

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
     * @param {Array<ConstraintDefinition>} [taxonomy] - The array of constraints, usually loaded from a schema.
     */
    constructor(taxonomy = ConstraintTaxonomy && ConstraintTaxonomy.constraintTypes ? ConstraintTaxonomy.constraintTypes : []) {
        // Ensure taxonomy is an array, handling potential failures during JSON loading.
        let constraints = taxonomy;
        if (!Array.isArray(constraints)) {
            console.error("Constraint taxonomy initialized with invalid structure. Resetting to empty array.");
            constraints = [];
        }

        /** @type {Map<string, ConstraintDefinition>} */
        this.taxonomyMap = new Map(constraints.map(c => [c.code, c]));
    }

    /**
     * Checks if a provided configuration payload adheres to a specific set of constraints.
     * @param {Object} configuration - The system configuration (e.g., a planned deployment).
     * @param {Array<string>} requiredConstraintCodes - The specific subset of constraints to validate against (e.g., all HARD constraints).
     * @returns {Object} Validation result containing status and list of violations.
     */
    validate(configuration, requiredConstraintCodes) {
        const violations = [];

        for (const code of requiredConstraintCodes) {
            /** @type {ConstraintDefinition} */
            const constraintDef = this.taxonomyMap.get(code);

            if (!constraintDef) {
                console.warn(`Constraint code ${code} not found in taxonomy.`);
                continue;
            }
            
            // Delegating constraint execution to the capability function
            const adherenceCheck = executeConstraintCheck(constraintDef, configuration);

            if (!adherenceCheck.isMet) {
                violations.push({
                    code: constraintDef.code,
                    target: constraintDef.target_parameter || 'N/A',
                    severity: constraintDef.severity || 'UNKNOWN',
                    details: adherenceCheck.details || 'Adherence rule failed.'
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