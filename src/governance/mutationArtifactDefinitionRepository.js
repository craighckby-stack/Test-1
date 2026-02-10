/**
 * MADR: Mutation Artifact Definition Repository
 * V97.0.0: High-Fidelity Schema Governance Service
 *
 * Provides versioned, immutable storage and validation endpoints for key GSEP artifacts (M-01 Intent, M-02 Payload).
 * Ensures structural governance compliance required by ASR, CIM, and MPSE *before* computational heavy lifting
 * by leveraging pre-compiled JSON Schemas via the ValidatorCompilerRegistry plugin.
 *
 * Architectural Contracts:
 * 1. Store and retrieve cryptographically hashed schemas.
 * 2. Pre-compile schemas for ultra-fast validation during runtime.
 * 3. Offer highly descriptive validation failure reports using standard Ajv error formatting.
 */
const artifactSchemas = require('./madr/schema_manifest.json');
// Dependency renamed to reflect its role as the underlying Ajv/SSV Compiler Engine required by VCR.
const CompilerEngine = require('../utils/schemaValidator'); 

/**
 * Custom Error Definitions for Governance Layer
 */
class GovernanceError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'GovernanceError';
        this.context = context;
    }
}

class ValidationFailureError extends GovernanceError {
    constructor(message, validationErrors, context = {}) {
        super(message, context);
        this.name = 'ValidationFailureError';
        this.validationErrors = validationErrors;
    }
}

/**
 * AGI-KERNEL Plugin Proxy: ValidatorCompilerRegistry (VCR)
 * This class serves as a functional proxy for the extracted VCR plugin, which manages
 * the lifecycle of schema compilation and storage based on a composite key.
 * It requires an external compiler instance (e.g., StructuralSchemaValidator/Ajv wrapper).
 */
class ValidatorCompilerRegistryProxy {
    constructor(compiler) {
        this.compiler = compiler;
        this.compiledValidators = {};
    }
    register(key, schema) {
        if (!schema || typeof schema !== 'object') throw new Error(`Registry Error: Invalid schema provided for key: ${key}`);
        try {
            // Use the external compiler engine to compile the schema
            this.compiledValidators[key] = this.compiler.compile(schema);
        } catch (e) {
            throw new Error(`Registry Compilation Error for ${key}: ${e.message}`);
        }
    }
    getValidator(key) {
        const validatorFn = this.compiledValidators[key];
        if (!validatorFn) {
            throw new Error('Registry Lookup Error: Validator not found for key: ' + key);
        }
        return validatorFn;
    }
}


class MutationArtifactDefinitionRepository {
    /**
     * @param {object} schemas - Optional override for the schema definitions map.
     */
    constructor(schemas = artifactSchemas) {
        this.schemas = schemas;
        
        // 1. Initialize the Compiler Engine (VCR dependency)
        const compilerInstance = new CompilerEngine(); 

        // 2. Initialize the ValidatorCompilerRegistry (VCR) plugin using the engine
        this.validatorRegistry = new ValidatorCompilerRegistryProxy(compilerInstance);

        // V97.0: Compile all required schemas upon initialization for peak runtime efficiency (ASR Stage 1 requirement).
        this._compileAllSchemas();
    }

    _compileAllSchemas() {
        try {
            for (const artifactId in this.schemas) {
                for (const version in this.schemas[artifactId]) {
                    const schema = this.schemas[artifactId][version];
                    const key = `${artifactId}:${version}`;
                    
                    // Use VCR plugin: register performs compilation and storage.
                    this.validatorRegistry.register(key, schema);
                }
            }
        } catch (e) {
            throw new GovernanceError(`MADR Critical Initialization Error: Schema compilation failed: ${e.message}`, { details: e });
        }
    }

    /**
     * Retrieves the canonical schema definition for a given artifact ID and version.
     * @param {string} artifactId - e.g., 'M-01', 'M-02'
     * @param {string} [version='latest'] - Specific schema version string.
     * @returns {object} The schema definition object.
     * @throws {GovernanceError} If the definition is missing.
     */
    getSchema(artifactId, version = 'latest') {
        const definitions = this.schemas[artifactId];
        if (!definitions) {
            throw new GovernanceError(`MADR Lookup Error (G-001): Artifact ID "${artifactId}" not registered in manifest.`);
        }
        const schema = definitions[version];
        if (!schema) {
             throw new GovernanceError(`MADR Lookup Error (G-002): Schema version "${version}" not found for artifact "${artifactId}".`);
        }
        return schema;
    }

    /**
     * Internal method to retrieve the pre-compiled validator function.
     * Uses the ValidatorCompilerRegistry (VCR).
     * @private
     */
    _getValidator(artifactId, version = 'latest') {
        const key = `${artifactId}:${version}`;

        try {
            // VCR retrieves the compiled Ajv function
            return this.validatorRegistry.getValidator(key);
        } catch (e) {
            // 1. Check if the schema definition exists first (G-001/G-002 check)
            this.getSchema(artifactId, version);
            
            // 2. If schema exists but validator is missing, it's an internal state failure (G-003)
            if (e.message.includes('Registry Lookup Error')) {
                throw new GovernanceError(`MADR Internal Error (G-003): Validator function not compiled for ${key}. Internal state mismatch.`);
            }
            throw e;
        }
    }


    /**
     * Validates an artifact payload against its mandatory schema (defaults to 'latest').
     * @param {string} artifactId - e.g., 'M-01', 'M-02'
     * @param {object} payload - The artifact data to validate.
     * @param {string} [version='latest'] - Specific schema version string.
     * @returns {boolean} True if validation passes.
     * @throws {ValidationFailureError} If validation fails.
     */
    validate(artifactId, payload, version = 'latest') {
        // 1. Get the compiled Ajv function
        const validateFn = this._getValidator(artifactId, version);

        // 2. Execute the function (Ajv standard)
        if (!validateFn(payload)) {
            // Ajv stores detailed errors on its property
            const errors = validateFn.errors || [];
            const context = {
                artifactId: artifactId,
                version: version,
                // Truncate payload for secure logging/debugging context
                payloadSample: JSON.stringify(payload).substring(0, 150) + '...'
            };

            throw new ValidationFailureError(
                `Governance Validation Failed for ${artifactId} v${version}. Payload violates canonical schema definition.`,
                errors,
                context
            );
        }

        return true;
    }
}

// Export the initialized singleton instance and the class definition.
module.exports = new MutationArtifactDefinitionRepository();
module.exports.MutationArtifactDefinitionRepository = MutationArtifactDefinitionRepository;
