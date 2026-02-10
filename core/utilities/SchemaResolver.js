/**
 * SchemaResolver
 * 
 * Utility class responsible for loading, resolving, and validating the
 * hierarchical TEDS field definitions (schema/teds_field_definitions.json).
 * It handles JSON Schema '$ref' resolution using the InternalReferenceResolverTool,
 * template merging, and applies layered metadata constraints before compiling the final runtime schema.
 */

// We use 'require' here to abstract the dependency injection of the InternalReferenceResolverTool
// based on standard Node.js module loading for compatibility with the original module structure.
const InternalReferenceResolverTool = require('InternalReferenceResolverTool'); 

class SchemaResolver {
  // TypeScript allowed in new_code
  private schema: any;
  private templates: any;
  private metadata: any;
  private resolver: any;

  constructor(schemaData) {
    this.schema = schemaData;
    this.templates = schemaData.FieldTemplates;
    this.metadata = schemaData.Metadata;

    // Validate tool availability (simulated injection)
    if (typeof InternalReferenceResolverTool.resolve !== 'function') {
        throw new Error("InternalReferenceResolverTool not correctly initialized or available.");
    }
    this.resolver = InternalReferenceResolverTool;
  }

  /**
   * Resolves an internal JSON Pointer reference using the dedicated utility tool.
   * @param {string} refPath - The JSON Pointer path (e.g., '#/FieldTemplates/ID_UUID').
   * @returns {any} A deep copy of the resolved object.
   */
  resolveReference(refPath) {
    return this.resolver.resolve({
      data: this.schema,
      refPath: refPath
    });
  }

  compileDefinition(definitionKey) {
    const definition = this.schema.Definitions[definitionKey];
    if (!definition) {
      throw new Error(`Definition not found: ${definitionKey}`);
    }

    const compiledFields = {};
    
    for (const fieldName in definition.fields) {
      let field = definition.fields[fieldName];
      
      if (field['$ref']) {
        // Use the new simplified reference resolution wrapper
        const template = this.resolveReference(field['$ref']);
        // Merge: template properties are base, field properties are overrides
        field = { ...template, ...field };
        delete field['$ref'];
      }

      // Apply global metadata constraints if necessary (future extension)

      compiledFields[fieldName] = field;
    }

    return {
      key: definition.key,
      description: definition.description,
      fields: compiledFields
    };
  }

  getCompiledSchema(definitionKey) {
    return this.compileDefinition(definitionKey);
  }

  getSystemMetadata() {
    return this.metadata;
  }
}

module.exports = SchemaResolver;