const TemplateNotFoundError = require('../errors/TemplateNotFoundError');
const InputValidationError = require('../errors/InputValidationError');

/**
 * Service responsible for validating SMS template configurations 
 * against a schema and runtime input data against template requirements.
 */
class TemplateValidationService {
  /**
   * @param {Object} dependencies - External tools required by the service.
   * @param {Object} dependencies.validator - JSON Schema validator instance (e.g., AJV).
   * @param {Function} dependencies.segmentCalculator - Utility function to calculate SMS segments.
   * @param {Object} schemaConfig - The master configuration schema.
   * @param {Array<Object>} messageTemplates - Array of template objects.
   */
  constructor({ validator, segmentCalculator }, schemaConfig, messageTemplates) {
    if (!validator) {
      throw new Error("TemplateValidationService requires a 'validator' dependency.");
    }
    this.validator = validator;
    this.calculateSegments = segmentCalculator; 
    this.schema = schemaConfig;
    this.templates = new Map(messageTemplates.map(t => [t.template_key, t]));
  }

  /**
   * Validates runtime input data against required variables and segment limits.
   * @param {string} templateKey - The key of the SMS template.
   * @param {Object} inputData - Runtime data for substitution.
   * @returns {boolean} True if validation passes.
   * @throws {TemplateNotFoundError} If template key is invalid.
   * @throws {InputValidationError} If data is missing variables or exceeds limits.
   */
  validateRuntimeData(templateKey, inputData) {
    const template = this.templates.get(templateKey);
    if (!template) {
      throw new TemplateNotFoundError(`Template not found: ${templateKey}`);
    }

    this._checkRequiredVariables(template, templateKey, inputData);
    this._checkMessageConstraints(template, templateKey, inputData);
    
    return true;
  }

  /**
   * Internal helper to check for missing required variables.
   */
  _checkRequiredVariables(template, templateKey, inputData) {
    const missingVars = template.required_variables.filter(
      requiredVar => !(requiredVar in inputData)
    );

    if (missingVars.length > 0) {
      throw new InputValidationError(`Missing required variables for template ${templateKey}: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Internal helper to check message constraints (segments).
   */
  _checkMessageConstraints(template, templateKey, inputData) {
    if (this.calculateSegments) {
        // Uses the injected segment calculator utility
        const segments = this.calculateSegments({
            content: template.content,
            data: inputData, 
            encoding: template.encoding
        });

        // Default max_segments to a sensible limit (e.g., 5) if undefined
        const maxSegments = template.max_segments || 5; 

        if (segments > maxSegments) {
            throw new InputValidationError(`Message for template ${templateKey} exceeds maximum segment limit (${segments}/${maxSegments}).`);
        }
    }
    // If calculateSegments is missing, constraints check is skipped, but structure remains sound.
  }

  /**
   * Validates the configuration file itself against the JSON schema.
   * This should run during system initialization.
   * @param {Object} config - The SMS configuration object being validated.
   * @throws {Error} If configuration validation fails.
   */
  validateSchemaIntegrity(config) {
    const isValid = this.validator.validate(this.schema, config);

    if (!isValid) {
      // Provide detailed errors from the validator instance
      const errors = this.validator.errors ? JSON.stringify(this.validator.errors) : "Unknown validation error.";
      throw new Error(`SMS Template Schema Integrity Check Failed: ${errors}`);
    }

    return true;
  }
}

module.exports = TemplateValidationService;
