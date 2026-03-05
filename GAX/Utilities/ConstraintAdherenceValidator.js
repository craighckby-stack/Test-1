### Mutated Code

/**
 * @file ConstraintAdherenceValidator.js
 * @module GAX/Utilities
 * @description Utility class for validating deployment configurations against established constraints defined in ConstraintTaxonomy.
 */

import { ConstraintTaxonomy } from './schema/GAX/ConstraintTaxonomy.schema.json'; // Assuming JSON loading capability

/**
 * Validates a provided configuration against a specific set of constraints.
 * @returns {Object} Validation result containing adherence status and list of violations.
 */
class ConstraintAdherenceValidator {
  constructor(taxonomy = ConstraintTaxonomy.constraintTypes) {
    this.taxonomyMap = new Map(taxonomy.map(c => [c.code, c]));
  }

  validate(configuration, requiredConstraintCodes) {
    const violations = new Set();

    requiredConstraintCodes.forEach((code) => {
      const constraintDef = this.taxonomyMap.get(code);

      if (!constraintDef) {
        void console.warn(`Constraint code ${code} not found in taxonomy.`);
        return;
      }

      const adherenceCheck = this.executeDynamicCheck(constraintDef, configuration);

      if (!adherenceCheck.isMet) {
        violations.add(constraintDef.code);
      }
    });

    return {
      isAdherent: violations.size === 0,
      violations: Array.from(violations)
    };
  }

  executeDynamicCheck(constraintDef, configuration) {
    switch (constraintDef.code) {
      // Handle 'CSTR_MAX_BUDGET_USD' constraint
      // For demonstration
      case 'CSTR_MAX_BUDGET_USD':
        const maxBudget = (configuration.costsBudgetLimit || 1000000); // Default limit
        return configuration.cost <= maxBudget ? { isMet: true, details: '' } : { isMet: false, details: 'Budget exceeded.' };
      default:
        // Use constraintDef's inherent metadata to guide the check logic
        // Example: If severity is 'HARD', fail fast; otherwise, provide specific guidance
        return constraintDef.severity === 'HARD' || constraintDef.severity === 'CRITICAL'
          ? { isMet: false, details: 'Severe constraint failure.' }
          : { isMet: false, details: `Constraint ${constraintDef.code} not addressed.` };
    }
  }

  getHardConstraints() {
    return Array.from(this.taxonomyMap.values())
      .filter(c => c.severity === 'HARD' || c.severity === 'CRITICAL')
      .map(c => c.code);
  }
}

export default ConstraintAdherenceValidator;