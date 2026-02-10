/**
 * core/validation/ContentValidatorRegistry.js
 * Manages and retrieves specific content validators (e.g., JsSchemaValidator, YamlLinter).
 * Ensures a centralized, single source of truth for validation routines via the Singleton pattern.
 * 
 * NOTE: Assumes ServiceRegistry base class is available.
 */
class ContentValidatorRegistry extends ServiceRegistry { 
  constructor() {
    // 1. Singleton Check
    if (ContentValidatorRegistry.instance) {
        return ContentValidatorRegistry.instance;
    }
    // 2. Initialize ServiceRegistry (sets up internal map for storage)
    super(); 
    ContentValidatorRegistry.instance = this;
  }

  /**
   * Registers a new validator utility.
   * A validator must implement an `async validate(content, config)` method.
   * @param {string} name - The identifier used in artifact definitions (e.g., 'jsLinter').
   * @param {Object} validatorInstance - The validator implementation.
   * @throws {Error} If the validator does not implement the required method.
   */
  registerValidator(name, validatorInstance) {
    if (typeof validatorInstance.validate !== 'function') {
      throw new Error(`[ContentValidatorRegistry] Validator instance for '\${name}' must implement an async validate(content, config) method.`);
    }
    
    // Delegate storage and key validation to the base registry
    if (super.has(name)) {
        // console.warn(`[ContentValidatorRegistry] Validator '\${name}' is being overwritten.`);
    }
    super.register(name, validatorInstance);
  }

  /**
   * Retrieves a validator by name.
   * @param {string} name
   * @returns {Object | null} The registered validator or null if not found.
   */
  getValidator(name) {
    return super.get(name);
  }

  /**
   * @returns {Array<string>} List of registered validator names.
   */
  getRegisteredValidatorNames() {
      return super.getKeys();
  }
}

// Create and export the single instance (Singleton)
module.exports = new ContentValidatorRegistry();