class GAX_PreFlightConstraintEngine {
  constructor(constraintDefinition) {
    this.constraints = constraintDefinition.mandatory_constraints;
    this.typeMap = constraintDefinition.required_types;
  }

  /**
   * Checks the type of a value against the expected type, handling complex types like array and object.
   * @param {*} value The value to check.
   * @param {string} expectedType The type string ('string', 'number', 'array', 'object', 'null').
   * @returns {boolean}
   */
  _checkType(value, expectedType) {
    if (value === undefined) return false; 
    if (value === null) return expectedType === 'object' || expectedType === 'null';
    if (expectedType === 'array') return Array.isArray(value);
    if (expectedType === 'object') return typeof value === 'object' && !Array.isArray(value);
    
    return typeof value === expectedType;
  }

  /**
   * Executes a defined validation rule against a given value.
   * @param {*} value The value extracted from the artifact.
   * @param {object} rule The rule definition (type, expected, required, etc.).
   * @returns {boolean}
   */
  _executeRule(value, rule) {
    const isDefined = value !== undefined && value !== null;

    if (rule.type === 'presence') {
      // Assumes rule.required is a boolean flag for structural necessity
      return rule.required ? isDefined : true;
    }
    
    // Skip further checks if the field is not present and not required to be present
    if (!isDefined) return true; 

    if (rule.type === 'dataType') {
      const expectedType = rule.expected;
      return this._checkType(value, expectedType);
    }
    
    if (rule.type === 'valueMatch') {
        return value === rule.expectedValue;
    }
    
    // Default: unknown rule type passes validation
    return true;
  }

  /**
   * Robust implementation of reliable JSON path traversal using dot notation.
   * Throws 'PathNotFound' if any part of the path is missing or undefined.
   * @param {object} artifact The data structure to traverse.
   * @param {string} path Dot-notation path (e.g., 'data.user.id').
   * @returns {*} The value at the path.
   */
  _getValueAtPath(artifact, path) {
    if (!path || !artifact) return undefined;
    
    const pathParts = path.split('.');
    let current = artifact;

    for (const part of pathParts) {
      if (current === undefined || current === null || !(part in current)) {
        // Use a specific internal signal for path not found
        throw new Error('PathNotFound'); 
      }
      current = current[part];
    }
    return current;
  }

  async validate(targetArtifact) {
    const results = [];
    
    // 1. Mandatory Constraint Execution (Structural)
    for (const constraint of this.constraints) {
      const { targetPath: path, rule, constraintId } = constraint;
      let value = undefined;
      let pathFound = true;
      let isValid = true;

      try {
        value = this._getValueAtPath(targetArtifact, path);
      } catch (e) {
        if (e.message === 'PathNotFound') {
            pathFound = false;
        } else {
            // Handle unexpected structural errors (e.g., trying to index a primitive)
            results.push({ constraint: constraintId, path, status: 'ERROR', reason: `Internal path resolution failure: ${e.message}` });
            continue;
        }
      }

      if (!pathFound) {
        // If path is not found, only a mandatory 'presence' rule can fail here.
        if (rule.type === 'presence' && rule.required === true) {
            isValid = false;
            results.push({ constraint: constraintId, path, status: 'FAILED', reason: `Mandatory field is missing.` });
        }
        continue; // Skip execution of other rules if the path doesn't exist
      }
      
      // Execute rule on found value
      isValid = this._executeRule(value, rule);
      
      if (!isValid) {
        results.push({ constraint: constraintId, path, status: 'FAILED', reason: `Rule type ${rule.type} failed validation.` });
      }
    }

    // 2. Required Type Validation (Semantic)
    for (const [path, expectedType] of Object.entries(this.typeMap)) {
      try {
        const value = this._getValueAtPath(targetArtifact, path);
        
        // Only check type if the value is defined and not null (unless expected type is null or object)
        if (value !== undefined && value !== null) {
            const typeOK = this._checkType(value, expectedType);
            
            if (!typeOK) {
                 results.push({ path, status: 'FAILED', reason: `Required type validation failed. Expected '${expectedType}', got '${Array.isArray(value) ? 'array' : typeof value}'.` });
            }
        } else if (value === undefined && expectedType !== 'undefined' && expectedType !== 'null') {
             // If the path exists (wasn't PathNotFound) but resolved to undefined, it's often a failure
             results.push({ path, status: 'FAILED', reason: `Required type validation failed: Value at path is undefined.` });
        }

      } catch (e) {
        if (e.message === 'PathNotFound') {
             // If PathNotFound occurs, it indicates a structural issue for a required type.
             results.push({ path, status: 'FAILED', reason: `Required path for type check was not found in artifact.` });
        } else {
             results.push({ path, status: 'ERROR', reason: `Type validation error: ${e.message}` });
        }
      }
    }

    if (results.length > 0) {
      // Throw an error with the structured results array attached for robust downstream processing
      const error = new Error(`GAX Pre-Flight Validation Failed: ${results.length} critical issues detected.`);
      error.results = results; 
      throw error;
    }
    return true;
  }
}

module.exports = GAX_PreFlightConstraintEngine;