/**
 * @file ConstraintAdherenceValidator.js
 * @module GAX/Utilities
 * @description Utility class for validating deployment configurations against established constraints defined in ConstraintTaxonomy.
 */

import { ConstraintTaxonomy } from './schema/GAX/ConstraintTaxonomy.schema.json'; // Assuming JSON loading capability

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
     * Initializes the validator and sets up the rule execution engine.
     * @param {Array<ConstraintDefinition>} [taxonomy] - The array of constraints, usually loaded from a schema.
     */
    constructor(taxonomy = ConstraintTaxonomy && ConstraintTaxonomy.constraintTypes ? ConstraintTaxonomy.constraintTypes : []) {
        // Ensure taxonomy is an array, handling potential failures during JSON loading.
        if (!Array.isArray(taxonomy)) {
            console.error("Constraint taxonomy initialized with invalid structure.");
            taxonomy = [];
        }

        this.taxonomyMap = new Map(taxonomy.map(c => [c.code, c]));
        /** @type {Map<string, function(ConstraintDefinition, Object): ValidationResult>} */
        this.ruleExecutors = new Map();
        this._initializeDefaultRules();
    }

    /**
     * Registers foundational validation rules.
     * This method is a key point for emergent capability injection in future cycles.
     */
    _initializeDefaultRules() {
        // Rule 1: Presence Check (A required parameter must exist in the configuration)
        this.ruleExecutors.set('presence_check', (constraintDef, configuration) => {
            const target = constraintDef.target_parameter;
            const isPresent = target && configuration && configuration.hasOwnProperty(target);
            return {
                isMet: isPresent,
                details: isPresent ? null : `Required parameter '${target}' is missing.`
            };
        });

        // Rule 2: Placeholder for numerical limits (e.g., budget check)
        this.ruleExecutors.set('numerical_limit', (def, config) => {
            // AGI logic implementation goes here: compare config[def.target_parameter] against def.expected_value
            return { isMet: true }; // Scaffolding
        });
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
            
            const adherenceCheck = this.executeConstraintCheck(constraintDef, configuration);

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
     * Executes the specific technical check for a constraint against a configuration
     * by looking up the appropriate rule executor based on constraintDef.check_type.
     * If no rule is found, it defaults to non-adherence for safety.
     * @param {ConstraintDefinition} constraintDef - The definition of the constraint to check.
     * @param {Object} configuration - The system configuration.
     * @returns {ValidationResult} Adherence status.
     */
    executeConstraintCheck(constraintDef, configuration) {
        const checkType = constraintDef.check_type;

        if (!checkType) {
             return { isMet: false, details: 'Constraint definition is missing required "check_type" for validation execution.' };
        }

        const executor = this.ruleExecutors.get(checkType);

        if (executor) {
            return executor(constraintDef, configuration);
        }

        // Defaulting to failure if no specific executor is found ensures system safety.
        return { 
            isMet: false, 
            details: `No runtime rule executor found for check type '${checkType}'. Constraint cannot be validated.`
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