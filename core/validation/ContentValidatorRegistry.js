/**
 * ContentValidatorRegistry.js
 * Manages and retrieves specific content validators (e.g., JsSchemaValidator, YamlLinter).
 * Allows external components to register specialized validation routines.
 */
class ContentValidatorRegistry {
  constructor() {
    this.validators = new Map();
  }

  /**
   * Registers a new validator utility.
   * @param {string} name - The identifier used in artifact definitions (e.g., 'jsLinter', 'packageJsonSchema').
   * @param {Object} validatorInstance - An object that must expose an `async validate(content, config)` method.
   */
  registerValidator(name, validatorInstance) {
    if (typeof validatorInstance.validate !== 'function') {
      throw new Error(`Validator instance for '${name}' must implement an async validate(content, config) method.`);
    }
    this.validators.set(name, validatorInstance);
  }

  /**
   * Retrieves a validator by name.
   * @param {string} name
   * @returns {Object|null}
   */
  getValidator(name) {
    return this.validators.get(name) || null;
  }
}

module.exports = ContentValidatorRegistry;
