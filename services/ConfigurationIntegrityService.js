import { validateSchema, applyPolicyConstraints, migrationHooks } from './schemaUtilities';

/**
 * ConfigurationIntegrityService: Ensures all persistent configuration objects adhere
 * to AGCA_PCTM_V1 (or higher) standards and manages version migration dynamically.
 */
export class ConfigurationIntegrityService {
  constructor(schemaVersion) {
    this.currentSchema = schemaVersion || 'v1.1';
  }

  /**
   * Validates a loaded configuration object against the current schema definition.
   * @param {object} configData - The configuration object to validate.
   */
  async validate(configData) {
    if (!configData.metadata || configData.metadata.schemaVersion < this.currentSchema) {
      throw new Error('Configuration lacks required metadata or is outdated.');
    }
    const validationResult = validateSchema(configData, this.currentSchema);
    if (!validationResult.isValid) {
      throw new Error(`Configuration invalid: ${validationResult.errors}`);
    }
    return validationResult.data;
  }

  /**
   * Attempts to gracefully migrate an older configuration to the current standard.
   * @param {object} oldConfig - The configuration object requiring migration.
   */
  async migrate(oldConfig) {
    if (oldConfig.metadata.schemaVersion < this.currentSchema) {
      console.log(`Migrating configuration from ${oldConfig.metadata.schemaVersion} to ${this.currentSchema}...`);
      const newConfig = migrationHooks.execute(oldConfig, this.currentSchema);
      return this.validate(newConfig); // Re-validate after migration
    }
    return oldConfig;
  }

  /**
   * Applies mandatory runtime policy constraints defined in the schema.
   */
  async enforceRuntimePolicy(configData) {
    return applyPolicyConstraints(configData.policy);
  }
}