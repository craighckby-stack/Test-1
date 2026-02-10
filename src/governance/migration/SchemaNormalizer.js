import { IFormatParserDelegatorTool } from './plugins/FormatParserDelegatorTool';
import { ICanonicalPayloadGenerator } from './plugins/CanonicalPayloadGenerator'; 
import { IStructuralSchemaValidatorTool } from './plugins/StructuralSchemaValidatorTool'; 

/**
 * Schema Normalizer Utility
 * Responsibility: Ingest raw schema definitions (e.g., SQL DDL, YAML configuration, API specifications)
 * and convert them into a standardized, deterministic Graph Model (Abstract Definition Tree - ADT)
 * suitable for consumption by the SchemaAnalyzer and the migration engine.
 * 
 * This decouples raw format handling from complex structural analysis by delegating tasks to reusable tools.
 */
export class SchemaNormalizer {

    private parserDelegator: IFormatParserDelegatorTool;
    private payloadGenerator: ICanonicalPayloadGenerator;
    private validator: IStructuralSchemaValidatorTool;
    private parserRegistry: Record<string, any>;

    /**
     * @param {Record<string, any>} parserRegistry - Map of format keys to parser objects.
     * @param {IFormatParserDelegatorTool} parserDelegator - Tool to select and execute format-specific parsers.
     * @param {ICanonicalPayloadGenerator} payloadGenerator - Tool to transform parsed data into a canonical graph.
     * @param {IStructuralSchemaValidatorTool} validator - Tool to validate the resulting graph structure.
     */
    constructor(
        parserRegistry: Record<string, any> = {},
        parserDelegator: IFormatParserDelegatorTool,
        payloadGenerator: ICanonicalPayloadGenerator,
        validator: IStructuralSchemaValidatorTool
    ) {
        if (!parserDelegator || !payloadGenerator || !validator) {
            throw new Error("Core tools (Delegator, Generator, Validator) must be provided.");
        }
        this.parserRegistry = parserRegistry;
        this.parserDelegator = parserDelegator;
        this.payloadGenerator = payloadGenerator;
        this.validator = validator;
    }

    /**
     * Ingests a raw definition and converts it into a standardized schema graph model.
     * @param {string | object} rawSchemaDefinition - Raw input schema data.
     * @param {string} format - The source format ('SQL', 'GraphQL', 'YAML', 'JSON_ADT').
     * @returns {Promise<object>} The standardized, validated graph representation.
     */
    async normalize(rawSchemaDefinition: string | object, format: string): Promise<object> {
        if (!rawSchemaDefinition) {
            throw new Error("Schema definition cannot be empty.");
        }

        console.log(`[SchemaNormalizer] Starting normalization from ${format} format...`);

        // 1. Parsing and Syntax Check (Delegated)
        const parsedStructure = await this.parserDelegator.execute({
            rawDefinition: rawSchemaDefinition,
            format,
            parserRegistry: this.parserRegistry // Pass instance state to the stateless tool
        });

        // 2. Dependency Mapping and Graph Construction (Canonical Generation)
        // Leveraging CanonicalPayloadGenerator to standardize the structure (ADT)
        const graphModel = await this.payloadGenerator.generate(parsedStructure, { targetType: 'SchemaADT' });
        
        // 3. Validation and Consistency Check (Structural Validation)
        // Leveraging StructuralSchemaValidatorTool to ensure graph integrity
        const validationResult = await this.validator.validate(graphModel, { context: 'Normalization' });

        if (!validationResult.isValid) {
            const errorMessages = validationResult.errors ? validationResult.errors.map(e => e.message).join(', ') : 'Unknown structural errors.';
            throw new Error(`Normalization failed due to structural validation errors: ${errorMessages}`);
        }

        return graphModel;
    }
}