/**
 * SchemaMergeValidator (v94.2)
 * Utility class responsible for merging base schemas (Core Indexing Metadata)
 * with custom schema fragments defined within an Artifact Indexing Policy (AIP)
 * and performing robust validation using Ajv.
 *
 * NOTE: Assumes Ajv instance is configured for desired schema dialect (e.g., draft 7/2020-12).
 * This utility focuses solely on the merging and compilation logic.
 */

// Utility function for creating a deep clone of basic JSON schema structures.
// Retained for zero external dependencies, optimized for schema objects.
const deepCloneSchema = (schema) => JSON.parse(JSON.stringify(schema));

class SchemaMergeValidator {
  /**
   * @param {import('ajv').Ajv} ajvInstance - The pre-configured Ajv instance.
   */
  constructor(ajvInstance) {
    if (!ajvInstance || typeof ajvInstance.compile !== 'function') {
      throw new Error('SchemaMergeValidator requires a valid Ajv instance.');
    }
    this.ajv = ajvInstance;
  }

  /**
   * Generates a predictable, cacheable ID for the composite schema based on the policy references.
   * @param {string} baseRef - The identifier of the base schema.
   * @param {boolean} hasCustomSchema - Whether a custom fragment was applied.
   * @returns {string} Unique schema cache ID.
   */
  _generateSchemaId(baseRef, hasCustomSchema) {
      return `AIP-Composite-${baseRef}-${hasCustomSchema ? 'CUSTOM' : 'BASE'}`;
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

    // Deep clone the base schema to maintain source immutability.
    const merged = deepCloneSchema(baseSchema);
    
    const baseProps = merged.properties || {};
    const customProps = customSchema.properties || {};

    // 1. Merge properties: Custom properties extend/overwrite base properties.
    merged.properties = { 
      ...baseProps,
      ...customProps
    };

    // 2. Merge required fields, ensuring uniqueness.
    const baseRequired = merged.required || [];
    const customRequired = customSchema.required || [];
    // Use Set for unique union, then sort for deterministic output.
    merged.required = [...new Set([...baseRequired, ...customRequired])].sort();

    // 3. Handle additionalProperties: Custom fragment explicitly overrides base.
    if (customSchema.additionalProperties !== undefined) {
      merged.additionalProperties = customSchema.additionalProperties;
    }

    return merged;
  }

  /**
   * Validates a metadata payload against the policy schema. Handles schema resolution,
   * merging, compilation, and caching. Note: For large systems, consider moving policy 
   * resolution and fetching outside of this class (see PolicyService scaffold proposal).
   *
   * @param {object} policy - The full ArtifactIndexingPolicy object (must contain $defs).
   * @param {object} data - The metadata payload to validate.
   * @returns {{isValid: boolean, errors: import('ajv').ErrorObject[] | null, schemaId: string}} Validation result object.
   */
  validate(policy, data) {
    
    // 1. Resolve base schema reference path from policy structure.
    const refPath = policy.indexing_structure?.['$ref'];
    const coreSchemaRef = refPath?.split('/')?.pop();
    
    if (!coreSchemaRef || !policy.$defs || !policy.$defs[coreSchemaRef]) {
        const missingRef = coreSchemaRef || (refPath ? `Ref target ${refPath}` : "Missing $ref");
        return {
            isValid: false,
            errors: [{ keyword: 'system', message: `Base indexing definition not resolvable: ${missingRef}.` }],
            schemaId: coreSchemaRef || 'unknown'
        };
    }

    const baseSchema = policy.$defs[coreSchemaRef]; 
    const customSchemaFragment = policy.custom_metadata_schema;
    
    // 2. Create the composite schema.
    const compositeSchema = this.createCompositeSchema(
      baseSchema,
      customSchemaFragment
    );
    
    // 3. Generate schema ID for Ajv caching.
    const schemaId = this._generateSchemaId(coreSchemaRef, !!customSchemaFragment);

    let validateFn;
    
    try {
        validateFn = this.ajv.getSchema(schemaId);

        if (!validateFn) {
            // Compile the dynamic schema and register it.
            this.ajv.addSchema(compositeSchema, schemaId);
            validateFn = this.ajv.getSchema(schemaId); 

            if (!validateFn) {
                // Should not happen if Ajv compiles successfully but included for robustness.
                throw new Error("Ajv failed to retrieve compiled schema after successful add.");
            }
        }

        const isValid = validateFn(data);

        return {
            isValid,
            errors: isValid ? null : validateFn.errors,
            schemaId: schemaId
        };
        
    } catch (e) {
      // Handle Ajv compilation errors (e.g., malformed schemas).
      console.error(`AJV Compilation Error for schema ID ${schemaId}. Policy Ref: ${coreSchemaRef}`, e);
      return {
        isValid: false,
        errors: [{ keyword: 'compilation', message: `Schema compilation failed: ${e.message}` }],
        schemaId: schemaId
      };
    }
  }
}

module.exports = SchemaMergeValidator;
