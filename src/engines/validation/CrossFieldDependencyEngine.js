const { ValidationError } = require('../../utils/ValidationError');

/**
 * NOTE: This engine requires the ObjectPathResolver plugin to be available in the execution context.
 */

/**
 * Manages the evaluation of dependency constraints (e.g., A requires B, C mutually exclusive with D).
 * This engine focuses solely on relationships between fields, not single-field data type validation.
 */
class CrossFieldDependencyEngine {

  /**
   * Internal map linking common schema directives (keys) to evaluation methods (handlers).
   * Standardizes the dependency syntax interpretation across the application.
   */
  static DEPENDENCY_MAP = {
    // Field must be present if a specified condition (value match/presence) in another field is met.
    'requiresIf': CrossFieldDependencyEngine._evaluateRequirement,
    // Ensures fields are mutually exclusive (only one can have a value).
    'mutuallyExclusive': CrossFieldDependencyEngine._evaluateExclusion,
    // Defines complex conditional requirements based on a specific value match (e.g., IF A='X', THEN B is required)
    'conditionalRule': CrossFieldDependencyEngine._evaluateConditional
  };

  /**
   * Executes all cross-field dependency validation rules by iterating through schema directives.
   * 
   * @param {Object} fieldSchema - The specific schema definition for the field currently being evaluated.
   * @param {string} currentFieldPath - Dot-separated path of the field being evaluated (e.g., 'user.address.zip').
   * @param {Object} dataContext - The full input object being validated (root data).
   * @returns {Array<ValidationError>} List of accumulated validation errors.
   */
  static execute(fieldSchema, currentFieldPath, dataContext) {
    const errors = [];

    if (!fieldSchema || typeof fieldSchema !== 'object') {
        return errors;
    }
    
    for (const [directive, ruleDefinition] of Object.entries(fieldSchema)) {
      const handler = CrossFieldDependencyEngine.DEPENDENCY_MAP[directive];
      
      if (handler) {
        // Handlers must return an array of ValidationError instances
        const results = handler(currentFieldPath, ruleDefinition, dataContext);
        errors.push(...results);
      }
    }
    return errors;
  }

  // --- Internal Evaluation Helpers ---

  /**
   * Evaluates simple conditional requirement dependency: If currentFieldPath has a specific value or is present,
   * target fields must also have values.
   *
   * Rule Structure Example (within field A's schema):
   * requiresIf: { presenceOf: 'B', requiredTargets: ['C', 'D'] }
   *
   * @param {string} currentFieldPath - The field being evaluated (the source of the requirement).
   * @param {Object} ruleDefinition - Specific rules defining the condition and targets.
   * @param {Object} dataContext - Root data.
   * @returns {Array<ValidationError>}
   */
  static _evaluateRequirement(currentFieldPath, ruleDefinition, dataContext) {
    const errors = [];
    const { presenceOf, requiredTargets } = ruleDefinition;

    if (!presenceOf || !requiredTargets) {
        return errors; 
    }

    // 1. Check Condition 
    // Assumes ObjectPathResolver is available via the execution context.
    const dependencyValue = ObjectPathResolver.resolve(dataContext, presenceOf);

    // Check passes if the dependency field is present (not undefined and not null)
    if (dependencyValue !== undefined && dependencyValue !== null) { 
      const targets = Array.isArray(requiredTargets) ? requiredTargets : [requiredTargets];
      
      // 2. Evaluate Targets
      targets.forEach(targetFieldPath => {
        const targetValue = ObjectPathResolver.resolve(dataContext, targetFieldPath);
        
        if (targetValue === undefined || targetValue === null) {
          errors.push(new ValidationError(
            targetFieldPath, 
            `${targetFieldPath} is required because ${presenceOf} is provided. (Triggered by value: ${JSON.stringify(dependencyValue).substring(0, 50)})`,
            'dependency.required'
          ));
        }
      });
    }
    return errors;
  }
  
  /**
   * Stub: Logic for checking mutual exclusion.
   */
  static _evaluateExclusion(currentFieldPath, mutuallyExclusiveFields, dataContext) {
      // Implementation pending
      return []; 
  }

  /**
   * Stub: Logic for complex conditional requirements.
   */
  static _evaluateConditional(currentFieldPath, conditionalRules, dataContext) {
      // Implementation pending
      return [];
  }
}

module.exports = CrossFieldDependencyEngine;