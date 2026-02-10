/**
 * SchemaResolver
 * 
 * Utility class responsible for loading, resolving, and validating the
 * hierarchical TEDS field definitions (schema/teds_field_definitions.json).
 * It utilizes the TemplateDefinitionCompiler plugin for $ref resolution and template merging.
 */

// Dependencies
// We use 'require' here to abstract the dependency injection of the InternalReferenceResolverTool
// based on standard Node.js module loading for compatibility with the original module structure.
const InternalReferenceResolverTool = require('InternalReferenceResolverTool'); 
// Assuming TemplateDefinitionCompiler is available via module loading in the refactored environment
const TemplateDefinitionCompiler = require('TemplateDefinitionCompiler'); 

class SchemaResolver {
  // TypeScript allowed in new_code
  private schema: any;
  private templates: any;
  private metadata: any;
  private resolver: typeof InternalReferenceResolverTool;

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
   * Compiles a specific definition block (e.g., a form or record type) 
   * by resolving all template references within its fields.
   * @param {string} definitionKey - The key of the definition to compile.
   * @returns {object} The compiled definition object.
   */
  compileDefinition(definitionKey) {
    const definition = this.schema.Definitions[definitionKey];
    if (!definition) {
      throw new Error(`Definition not found: ${definitionKey}`);
    }

    const compiledFields = {};
    
    for (const fieldName in definition.fields) {
      let field = definition.fields[fieldName];
      
      // Use the abstracted plugin for reference resolution and template merging
      field = TemplateDefinitionCompiler.resolveAndMerge(
        field, 
        this.resolver, 
        this.schema
      );

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