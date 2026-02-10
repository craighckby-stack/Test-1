/**
 * AGI-KERNEL v7.9.2 Navigator Edition - Core Schema Validator Utility
 * Provides standardized, high-performance schema validation essential for data integrity 
 * across sensitive service boundaries.
 * 
 * Uses the StructuralSchemaValidator plugin for robust, recursive, and strict validation logic.
 */

class SchemaValidator_Util {

  // Define critical default schemas statically for clean separation from initialization logic
  static #defaultSchemas = {
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
    }
    // Future schemas: 'TelemetryEvent', 'ConfigurationUpdate'
  };

  constructor() {
    // CRITICAL: Access the StructuralSchemaValidator plugin injected into the runtime environment.
    if (typeof plugins === 'undefined' || !plugins.StructuralSchemaValidator) {
        throw new Error("CRITICAL: StructuralSchemaValidator plugin missing. Cannot initialize SchemaValidator_Util.");
    }
    this.validatorPlugin = plugins.StructuralSchemaValidator;
    
    // Register default schemas immediately upon initialization
    this.#initializeDefaultSchemas();
  }

  /**
   * Registers all predefined core schemas with the underlying validation engine.
   * @private
   */
  #initializeDefaultSchemas() {
    const schemasToRegister = SchemaValidator_Util.#defaultSchemas;
    
    for (const schemaName in schemasToRegister) {
        if (Object.hasOwnProperty.call(schemasToRegister, schemaName)) {
            this.registerSchema(schemaName, schemasToRegister[schemaName]);
        }
    }
  }
  
  /**
   * Dynamically registers a new schema definition using the StructuralSchemaValidator plugin.
   * @param {string} schemaName - The unique name of the schema.
   * @param {Object} definition - The schema definition object.
   */
  registerSchema(schemaName, definition) {
      this.validatorPlugin.execute({
          action: 'register',
          schemaName: schemaName,
          definition: definition
      });
  }

  /**
   * Validates input data against a defined schema using the StructuralSchemaValidator plugin.
   * @param {string} schemaName - The name of the schema to use.
   * @param {Object} data - The data payload to validate.
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate(schemaName, data) {
    const result = this.validatorPlugin.execute({
        action: 'validate',
        schemaName: schemaName,
        data: data
    });
    
    // The plugin returns { isValid, errors } directly.
    return result;
  }
}

module.exports = new SchemaValidator_Util();