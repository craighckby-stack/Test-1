const fs = require('fs/promises');
// Assuming Ajv is installed in the runtime environment for high-intelligence validation
const Ajv = require('ajv');
const addFormats = require('ajv-formats'); 

/**
 * Custom error type for ACVL validation failures.
 * Provides context and structure for downstream error handling (e.g., logging/telemetry).
 */
class ACVLIntegrityHalt extends Error {
    constructor(message, details = {}) {
        // Use interpolation for clearer error messages, especially from schema validation
        super(`[ACVL Integrity Halt] ${message}`);
        this.name = 'ACVLIntegrityHalt';
        this.details = details;
    }
}

/**
 * ACVD Validator & Constraint Loader (ACVL)
 * Enforces semantic and structural integrity of the Axiom Constraint Validation Domain (ACVD) file
 * BEFORE Stage S01 (CSR generation). Requires acvd_policy.json and its schema.
 */
class ACVLValidator {
    constructor(acvdPath = 'config/acvd_policy.json', schemaPath = 'config/acvd_policy_schema.json') {
        this.acvdPath = acvdPath;
        this.schemaPath = schemaPath;
        
        // Initialize Ajv instance for strict schema enforcement.
        this.ajv = new Ajv({ 
            allErrors: true, 
            coerceTypes: false, // Maintain strict type checking
            useDefaults: false 
        });
        // Add necessary format validators (e.g., regex checks defined in schema)
        addFormats(this.ajv);
        
        this._validateSchema = null;
    }

    /**
     * Utility function to safely load and parse JSON files asynchronously.
     * @param {string} path - The file path to load.
     * @param {string} purpose - Descriptive label for error reporting.
     * @returns {Promise<Object>}
     */
    async _loadJsonFile(path, purpose) {
        try {
            const content = await fs.readFile(path, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            if (error.code === 'ENOENT') {
                 throw new ACVLIntegrityHalt(`Required file not found: ${path}. Purpose: ${purpose}.`, { code: 'ENOENT' });
            }
            throw new ACVLIntegrityHalt(`Failed to load or parse ${purpose} file (${path}): ${error.message}`);
        }
    }

    /**
     * Loads the schema, ACVD configuration, and executes rigorous validation.
     * Replaces brittle internal checks with robust JSON Schema validation.
     */
    async loadAndValidate() {
        // 1. Load and compile schema (only runs on first call)
        if (!this._validateSchema) {
             const schema = await this._loadJsonFile(this.schemaPath, 'ACVD Policy Schema');
             this._validateSchema = this.ajv.compile(schema);
        }

        // 2. Load the ACVD file
        const config = await this._loadJsonFile(this.acvdPath, 'Axiom Constraint Validation Domain (ACVD)');
        
        // 3. Execute validation via Ajv
        const valid = this._validateSchema(config);

        if (!valid) {
            // Aggregate all Ajv errors into a detailed halt message
            const errors = this._validateSchema.errors.map(err => {
                return `Data path: ${err.instancePath || '/'} | Error: ${err.message}`;
            });
            
            throw new ACVLIntegrityHalt(
                `ACVD configuration failed rigorous schema validation. Total errors: ${errors.length}`,
                { 
                    validationErrors: errors,
                    ajvDetails: this._validateSchema.errors 
                }
            );
        }

        console.log(`[ACVL] ACVD V${config.governance_version} validated successfully against schema. Ready for CSR (S01) generation.`);
        return config; // Return validated constraints
    }
}

module.exports = { ACVLValidator, ACVLIntegrityHalt };
