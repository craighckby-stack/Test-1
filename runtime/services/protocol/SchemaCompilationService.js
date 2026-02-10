interface SchemaRegistry {
    getSchema(schemaId: string): Promise<any>;
}

interface CompilationTool {
    // Handles complex logic like calling Ajv, optimizing, etc.
    compile(schema: any): Function;
}

interface ErrorFormatterTool {
    // Standardizes the display of raw validation errors
    format(errors: any[]): string;
}

// Placeholder types for the injected plugins based on active list
type TSchemaCompilationAndValidationService = CompilationTool;
type TSchemaErrorFormatterTool = ErrorFormatterTool;

class SchemaCompilationService {
  private registry: SchemaRegistry;
  private validatorCache: Map<string, Function>;
  private compilationService: TSchemaCompilationAndValidationService;
  private errorFormatter: TSchemaErrorFormatterTool;

  constructor(
    schemaRegistry: SchemaRegistry,
    compilationService: TSchemaCompilationAndValidationService, // Delegating AJV/compilation logic
    errorFormatter: TSchemaErrorFormatterTool // Delegating error formatting
  ) {
    this.registry = schemaRegistry;
    this.validatorCache = new Map();
    this.compilationService = compilationService;
    this.errorFormatter = errorFormatter;
  }

  /**
   * Compiles and caches a schema validator function, delegating the heavy lifting.
   * @param schemaId The ID of the schema to load and compile.
   * @returns The compiled validator function (e.g., an Ajv validator function).
   */
  async compileSchema(schemaId: string): Promise<Function> {
    if (this.validatorCache.has(schemaId)) {
      return this.validatorCache.get(schemaId)!;
    }
    
    const schema = await this.registry.getSchema(schemaId);
    
    // Delegate high-performance compilation to SchemaCompilationAndValidationService
    const validate = this.compilationService.compile(schema); 
    
    this.validatorCache.set(schemaId, validate);

    return validate;
  }

  /**
   * Loads the enforcement schema, compiles it if necessary, and validates the context data.
   * @param contextData Data to validate against the enforcement schema.
   * @throws Error if validation fails, using formatted error details.
   */
  async validateEnforcement(contextData: any): Promise<boolean> {
    const enforcementValidator = await this.compileSchema('enforcement_schema.json');
    
    // Standard validator execution: returns boolean, errors attached to function object
    const isValid = enforcementValidator(contextData);
    
    if (!isValid) {
      const errors = enforcementValidator.errors || [];
      
      // Use SchemaErrorFormatterTool for standardized error reporting
      const formattedErrorDetails = this.errorFormatter.format(errors);

      throw new Error(`Enforcement context validation failed: ${formattedErrorDetails}`);
    }
    return true;
  }
}

module.exports = SchemaCompilationService;