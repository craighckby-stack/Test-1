/**
 * AGI-KERNEL v7.4.4 Navigator Edition - Core Schema Validator Utility
 * Provides standardized, high-performance schema validation essential for data integrity 
 * across sensitive service boundaries (e.g., governance, emergent interfaces).
 * 
 * Improvement Rationale (Cycle 0): Enhanced robustness to support complex, nested, 
 * and optional data structures required by a large-scale repository (2,300+ files).
 */

class SchemaValidator_Util {

  constructor() {
    // Centralized schema definitions for critical data flows
    this.schemas = {
      'FailureTraceLog': {
        timestamp: { type: 'string', required: true },
        component: { type: 'string', required: true },
        trace_id: { type: 'string', required: true, description: 'Unique ID for error correlation' },
        error_details: { 
            type: 'object', 
            required: true,
            // Nested schema to enforce structure of internal error payloads
            subSchema: {
                code: { type: 'number', required: true },
                message: { type: 'string', required: true },
                is_recoverable: { type: 'boolean', required: false }
            }
        }
      },
      // Future schemas: 'TelemetryEvent', 'ConfigurationUpdate'
    };
  }
  
  /**
   * Dynamically registers a new schema definition.
   * Essential for supporting emergent capabilities and modular extensions.
   * @param {string} schemaName - The unique name of the schema.
   * @param {Object} definition - The schema definition object.
   */
  registerSchema(schemaName, definition) {
      if (this.schemas[schemaName]) {
          console.warn(`[SchemaValidator] Overwriting existing schema: ${schemaName}`);
      }
      this.schemas[schemaName] = definition;
  }

  /**
   * Recursively validates data against a schema definition.
   * @param {Object} schema - The specific schema definition to validate against.
   * @param {Object} data - The data payload to validate.
   * @param {string} path - Current field path for error tracking.
   * @returns {string[]} An array of validation errors.
   */
  _recursiveValidate(schema, data, path = '') {
    const errors = [];
    
    // 1. Check for unknown fields in the data (strict validation enforced for AGI integrity)
    for (const dataField in data) {
        if (!schema[dataField]) {
            errors.push(`Unknown field detected at ${path}${dataField}. Strict validation enforced.`);
        }
    }

    // 2. Iterate through schema definitions
    for (const field in schema) {
      const definition = schema[field];
      const fieldValue = data[field];
      const currentPath = path ? `${path}.${field}` : field;

      // Required Check
      const isPresent = (typeof fieldValue !== 'undefined' && fieldValue !== null);
      if (definition.required && !isPresent) {
        errors.push(`Missing required field: ${currentPath}`);
        continue;
      }

      // Skip further checks if value is optional and not provided
      if (!isPresent && !definition.required) {
          continue;
      }

      // Type Check
      if (definition.type) {
        let actualType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue;

        // Special handling for null (which is typeof object)
        if (fieldValue === null) actualType = 'null';
        
        // Standardizing type comparison, allowing objects/arrays to pass basic object check
        if (definition.type === 'object') {
            if (actualType !== 'object' && actualType !== 'array') {
                 errors.push(`Field '${currentPath}' type mismatch. Expected ${definition.type} structure, got ${actualType}.`);
            }
        } else if (actualType !== definition.type) {
             errors.push(`Field '${currentPath}' type mismatch. Expected ${definition.type}, got ${actualType}.`);
        }
      }
      
      // 3. Recursive validation for objects that define a subSchema
      if (definition.type === 'object' && definition.subSchema && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
          const nestedErrors = this._recursiveValidate(definition.subSchema, fieldValue, currentPath);
          errors.push(...nestedErrors);
      }
    }
    return errors;
  }


  /**
   * Validates input data against a defined schema.
   * Enhanced for recursive and strict validation suitable for AGI internal comms.
   * @param {string} schemaName - The name of the schema to use.
   * @param {Object} data - The data payload to validate.
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate(schemaName, data) {
    const schema = this.schemas[schemaName];

    if (!schema) {
      return { isValid: false, errors: [`Schema definition '${schemaName}' not found.`] };
    }

    // Start recursive validation from the root
    const errors = this._recursiveValidate(schema, data);
    
    return { 
      isValid: errors.length === 0, 
      errors 
    };
  }
}

module.exports = new SchemaValidator_Util();