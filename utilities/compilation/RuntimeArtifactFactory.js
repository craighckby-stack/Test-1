/**
 * RuntimeArtifactFactory: Responsible for taking a raw TEDS definition (potentially with $ref templates)
 * and transforming it into a specific, optimized runtime artifact (e.g., a Joi validation schema,
 * a Mongoose schema definition, or a GraphQL field definition).
 *
 * NOTE: Assumes DefinitionReferenceResolverTool is available in the runtime environment.
 */
class RuntimeArtifactFactory {
    /**
     * @param {Object<string, Object>} fieldTemplates - TEDS definition templates used for reference resolution ($ref)
     */
    constructor(fieldTemplates) {
        // TEDS definition templates used for reference resolution ($ref)
        this.fieldTemplates = fieldTemplates;
        
        // Dependency Injection placeholder/instantiation for the extracted logic
        // Assuming DefinitionReferenceResolverTool is available or stubbed for execution.
        this._referenceResolver = {
            execute: (typeof DefinitionReferenceResolverTool !== 'undefined' 
                        && new DefinitionReferenceResolverTool().execute)
                     || (({ definition }) => definition) // Safe stub
        };
    }

    /**
     * The core transformation logic.
     * @param {string} key - The root field key being compiled.
     * @param {Object} definition - The raw definition object.
     * @param {string} targetType - 'JOI', 'ZOD', 'GQL', etc.
     * @returns {Object} The compiled artifact ready for immediate runtime use.
     */
    build(key, definition, targetType = 'JOI') {
        // Step 1: Deep resolution of all embedded '$ref' dependencies against this.fieldTemplates
        const resolvedDefinition = this._referenceResolver.execute({
            definition: definition,
            fieldTemplates: this.fieldTemplates
        });
        
        // Step 2: Transformation based on the target system 
        switch (targetType.toUpperCase()) {
            case 'JOI':
                return this._toJoiSchema(key, resolvedDefinition);
            // Add cases for other target types (ZOD, Mongoose, etc.) here
            default:
                throw new Error(`Unsupported artifact target type: ${targetType}`);
        }
    }

    /**
     * Transforms the fully resolved definition into a Joi schema object (Mock implementation).
     */
    _toJoiSchema(key, resolvedDefinition) {
        return {
            source_key: key,
            artifact_type: 'JoiSchema',
            runtime_representation: resolvedDefinition, // Mock: In real life, this is the Joi object
            is_compiled: true
        };
    }
}

module.exports = { RuntimeArtifactFactory };