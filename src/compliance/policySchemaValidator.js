// ID: CSV-01 (Compliance Schema Validator)
// Purpose: Enforces structural integrity of compliance configuration files using AJV.
import Ajv from 'ajv';
import * as fs from 'fs';
import path from 'path';

// Assuming this path for specialized error handling utilities
import { PolicyIntegrityError } from '../errors/policyErrors.js';

class PolicySchemaValidator {
    /**
     * @type {Ajv}
     */
    #ajv;
    /**
     * @type {import('ajv').ValidateFunction}
     */
    #validateFunction;

    constructor(schemaPath = path.resolve('config/governanceSchema.json')) {
        this.#ajv = new Ajv({
            allErrors: true, // Report all errors, not just the first one
            strict: true,
            // Enable stricter validation standards for high-stakes governance files
            keywords: ['typeof'], 
        });
        
        const schema = this.#loadSchema(schemaPath);
        
        try {
            // Compile schema immediately for maximum performance during validation execution
            this.#validateFunction = this.#ajv.compile(schema);
        } catch (e) {
            console.error("AJV Compilation Error: Schema appears invalid or corrupt.", e.message);
            throw new Error(`Failed to compile governance schema: ${e.message}`);
        }
    }

    #loadSchema(schemaPath) {
        // Load required JSON schema synchronously (standard for bootstrap configuration)
        try {
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            return JSON.parse(schemaContent);
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.warn(`Governance schema file not found at ${schemaPath}. Using internal minimal compliance structure.`);
                // Fallback internal schema definition
                return { 
                    type: "object", 
                    properties: {
                        compliance_level: { type: "string", pattern: "^L[0-9]+$" },
                        veto_triggers: { type: "array", items: { type: "string" } }
                    },
                    required: ["compliance_level", "veto_triggers"],
                    additionalProperties: false // Enforce strict structure adherence
                }; 
            }
            throw new Error(`Failed to load and parse governance schema from ${schemaPath}: ${e.message}`);
        }
    }

    /**
     * Validates the provided policy configuration data against the governance schema.
     * @param {object} policyConfigData - The configuration object from the Policy Engine (C-15).
     * @returns {true} If validation passes.
     * @throws {PolicyIntegrityError} If validation fails.
     */
    validate(policyConfigData) {
        if (!this.#validateFunction(policyConfigData)) {
            const errors = this.#validateFunction.errors || [];
            
            // Log detailed errors for immediate diagnostic assessment
            const errorDetails = errors.map(e => `[${e.dataPath || 'root'}] -> ${e.message} (Keyword: ${e.keyword})`).join('\n');
            console.error(`[CSV-01] Policy Schema Validation Failed (C-15 Input). Total Errors: ${errors.length}.\nDetails:\n${errorDetails}`);

            throw new PolicyIntegrityError(
                `Policy input failed compliance schema validation (CSV-01). Found ${errors.length} structural issues.`,
                errors 
            );
        }
        return true;
    }
}

export default PolicySchemaValidator;