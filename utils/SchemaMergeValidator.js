// Requires a robust JSON Schema library (e.g., Ajv) for dynamic schema merging.

/**
 * SchemaMergeValidator
 * Utility class responsible for merging base schemas with custom schema fragments
 * defined within an Artifact Indexing Policy (AIP) and performing validation.
 */
class SchemaMergeValidator {
  constructor(ajvInstance) {
    this.ajv = ajvInstance; // Inject Ajv instance
  }

  /**
   * Creates a composite schema by merging the CoreIndexingMetadata with
   * any artifact-specific custom metadata requirements.
   * @param {object} baseSchema - The resolved CoreIndexingMetadata schema.
   * @param {object | null} customSchema - The schema fragment from AIP.custom_metadata_schema.
   * @returns {object} The merged JSON Schema.
   */
  createCompositeSchema(baseSchema, customSchema) {
    if (!customSchema) {
      return baseSchema;
    }

    // Deep merge logic: Combine properties and required arrays.
    const merged = JSON.parse(JSON.stringify(baseSchema));
    
    // Merge properties
    merged.properties = { 
      ...(merged.properties || {}),
      ...(customSchema.properties || {})
    };

    // Merge required fields, ensuring uniqueness
    const baseRequired = merged.required || [];
    const customRequired = customSchema.required || [];
    merged.required = [...new Set([...baseRequired, ...customRequired])];

    // Allow additional properties if custom schema explicitly permits it, otherwise default to base.
    merged.additionalProperties = customSchema.additionalProperties !== undefined 
      ? customSchema.additionalProperties 
      : baseSchema.additionalProperties;

    return merged;
  }

  /**
   * Validates a ledger entry against the merged policy schema.
   * @param {object} policy - The full ArtifactIndexingPolicy object.
   * @param {object} data - The metadata payload to validate.
   * @returns {boolean} Validation result.
   */
  validate(policy, data) {
    // 1. Resolve the core indexing structure (requires pre-loading $defs).
    // NOTE: In a real system, baseSchema would be resolved from policy.$defs/CoreIndexingMetadata
    // For scaffolding, we assume the core structure is available or resolvable.

    const coreSchemaRef = policy.indexing_structure.$ref.split('/').pop();
    const baseSchema = policy.$defs[coreSchemaRef]; 
    
    if (!baseSchema) {
        console.error('Base indexing structure not found.');
        return false;
    }

    const compositeSchema = this.createCompositeSchema(
      baseSchema,
      policy.custom_metadata_schema
    );

    const validateFn = this.ajv.compile(compositeSchema);
    const isValid = validateFn(data);

    if (!isValid) {
      console.error('Validation Errors:', validateFn.errors);
    }

    return isValid;
  }
}

module.exports = SchemaMergeValidator;