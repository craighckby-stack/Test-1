/**
 * SchemaMergeValidator (v94.1)
 * Utility class responsible for merging base schemas (e.g., Core Indexing Metadata)
 * with custom schema fragments defined within an Artifact Indexing Policy (AIP)
 * and performing robust validation using Ajv.
 *
 * NOTE: Assumes Ajv instance is configured for desired schema dialect (e.g., draft 7/2020-12).
 * Best used in conjunction with a SchemaRegistry for pre-loaded base definitions.
 */
class SchemaMergeValidator {
  /**
   * @param {Ajv} ajvInstance - The pre-configured Ajv instance.
   */
  constructor(ajvInstance) {
    if (!ajvInstance || typeof ajvInstance.compile !== 'function') {
      throw new Error('SchemaMergeValidator requires a valid Ajv instance.');
    }
    this.ajv = ajvInstance;
  }

  /**
   * Creates a composite schema by performing a targeted deep merge,
   * combining 'properties' and 'required' arrays, favoring custom settings
   * for 'additionalProperties' while preserving the base schema's integrity.
   *
   * @param {object} baseSchema - The resolved CoreIndexingMetadata schema (or equivalent).
   * @param {object | null} customSchema - The schema fragment (e.g., AIP.custom_metadata_schema).
   * @returns {object} The merged JSON Schema (a deep copy of the base modified by custom).
   */
  createCompositeSchema(baseSchema, customSchema) {
    if (!customSchema) {
      return baseSchema; 
    }

    // Deep copy base schema to ensure immutability of the source.
    const merged = JSON.parse(JSON.stringify(baseSchema));
    
    // 1. Merge properties
    merged.properties = { 
      ...(merged.properties || {}),
      ...(customSchema.properties || {})
    };

    // 2. Merge required fields, ensuring uniqueness and standardizing order.
    const baseRequired = merged.required || [];
    const customRequired = customSchema.required || [];
    merged.required = [...new Set([...baseRequired, ...customRequired])].sort();

    // 3. Handle additionalProperties: Custom fragment overrides base, if specified.
    if (customSchema.additionalProperties !== undefined) {
      merged.additionalProperties = customSchema.additionalProperties;
    }
    // Otherwise, it inherits from baseSchema.

    return merged;
  }

  /**
   * Validates a metadata payload against the merged policy schema.
   * Incorporates schema caching using Ajv's internal mechanism.
   *
   * @param {object} policy - The full ArtifactIndexingPolicy object (must contain $defs).
   * @param {object} data - The metadata payload to validate.
   * @returns {{isValid: boolean, errors: import('ajv').ErrorObject[] | null, schemaId: string}} Validation result object.
   */
  validate(policy, data) {
    // Resolve the core schema reference from the policy structure.
    const coreSchemaRef = policy.indexing_structure?.['$ref']?.split('/')?.pop();
    
    if (!coreSchemaRef || !policy.$defs || !policy.$defs[coreSchemaRef]) {
        return {
            isValid: false,
            errors: [{ keyword: 'system', message: `Base indexing structure '${coreSchemaRef || "N/A"}' not found in policy definitions.` }],
            schemaId: coreSchemaRef || 'unknown'
        };
    }

    const baseSchema = policy.$defs[coreSchemaRef]; 
    const compositeSchema = this.createCompositeSchema(
      baseSchema,
      policy.custom_metadata_schema
    );
    
    // Generate unique ID based on the policy reference for Ajv caching.
    const schemaId = `AIP-${coreSchemaRef}-${policy.custom_metadata_schema ? 'custom' : 'base'}`;

    let validateFn;
    
    try {
        // 1. Attempt to retrieve a cached compiled validator function.
        validateFn = this.ajv.getSchema(schemaId);

        if (!validateFn) {
            // 2. If not cached, compile the dynamic schema and register it for caching.
            this.ajv.addSchema(compositeSchema, schemaId);
            validateFn = this.ajv.getSchema(schemaId); 
        }

        const isValid = validateFn(data);

        return {
            isValid,
            errors: isValid ? null : validateFn.errors,
            schemaId: schemaId
        };
        
    } catch (e) {
      // Handle Ajv compilation errors (e.g., malformed schemas)
      console.error(`AJV Compilation Error for schema ID ${schemaId}:`, e);
      return {
        isValid: false,
        errors: [{ keyword: 'compilation', message: `Schema compilation failed: ${e.message}` }],
        schemaId: schemaId
      };
    }
  }
}

module.exports = SchemaMergeValidator;