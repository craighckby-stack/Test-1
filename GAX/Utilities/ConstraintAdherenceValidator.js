/**
 * @file ConstraintAdherenceValidator.js
 * @module GAX/Utilities
 * @description Utility class for validating deployment configurations against established constraints defined in ConstraintTaxonomy.
 */

import { ConstraintTaxonomy } from './schema/GAX/ConstraintTaxonomy.schema.json'; // Assuming JSON loading capability
// Assuming RuleExecutionEngine is imported from a standard module path
// import { RuleExecutionEngine } from '../Services/RuleExecutionEngine';

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

// Placeholder definition for RuleExecutionEngine usage, assuming it's imported.
// In a real refactor, this class would be imported.
const RuleExecutionEngine = globalThis.RuleExecutionEngine || class MockRuleEngine { constructor() { this.executors = new Map(); } registerRule() {} executeRule(type, ...args) { const executor = this.executors.get(type); return executor ? executor(...args) : null; } };

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
        
        /** @type {RuleExecutionEngine} */
        this.ruleEngine = new RuleExecutionEngine();
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

        // Delegation to the Rule Execution Engine
        const result = this.ruleEngine.executeRule(checkType, constraintDef, configuration);

        if (result !== null) {
            return result;
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