import Ajv from 'ajv';
import {
    AJV_BASE_CONFIG,
    MINIMAL_FALLBACK_SCHEMA,
    DEFAULT_GOVERNANCE_SCHEMA_PATH
} from './schema/PolicySchemaDefinitions.js';
import fs from 'fs/promises';
// Assuming a logging utility is available or configured globally
// import { Logger } from '../utils/Logger.js';

const log = console; // Placeholder for robust Logger utility

/**
 * Manages the loading, compilation, and validation of governance policies
 * against defined JSON schemas using AJV. This centralizes validation logic.
 */
export class PolicyValidatorService {
    constructor() {
        // Initialize AJV instance with strict base configuration
        this.ajv = new Ajv(AJV_BASE_CONFIG);

        // Pre-compile fallback schema immediately for emergency use
        this.fallbackValidator = this.ajv.compile(MINIMAL_FALLBACK_SCHEMA);

        // Holds the compiled validator for the primary configuration file
        this.primaryValidator = null; 
    }

    /**
     * Loads the primary governance schema from the defined path and compiles it.
     * @param {string} [schemaPath] - Optional path to schema file.
     * @returns {Promise<boolean>} True if primary schema was loaded, false otherwise.
     */
    async loadPrimarySchema(schemaPath = DEFAULT_GOVERNANCE_SCHEMA_PATH) {
        try {
            const schemaContent = await fs.readFile(schemaPath, 'utf-8');
            const primarySchema = JSON.parse(schemaContent);
            
            // Assign an ID if missing for retrieval
            if (!primarySchema.$id) {
                primarySchema.$id = 'main-governance-schema';
            }

            // Add and compile schema
            this.ajv.addSchema(primarySchema);
            this.primaryValidator = this.ajv.getSchema(primarySchema.$id);
            
            if (!this.primaryValidator) {
                throw new Error("Failed to compile primary schema definition.");
            }
            log.log(`[PolicyValidator] Primary governance schema loaded from ${schemaPath}`);
            return true;
        } catch (error) {
            log.warn(`[PolicyValidator] Could not load primary schema (${schemaPath}). Falling back to minimal internal schema. Error: ${error.message}`);
            this.primaryValidator = this.fallbackValidator;
            return false;
        }
    }

    /**
     * Validates a configuration object against the currently loaded primary schema (or fallback).
     * @param {object} config - The configuration object to validate.
     * @returns {{isValid: boolean, errors: array}} Validation result.
     */
    validate(config) {
        const validator = this.primaryValidator || this.fallbackValidator;
        
        const isValid = validator(config);
        
        return {
            isValid,
            errors: validator.errors || []
        };
    }
}