import { Logger } from '../utils/Logger.js';
import { SchemaValidationEngine } from '../utils/SchemaValidationEngine.js'; // Assumed import for the extracted tool
import { SafeFileLoader } from '../utils/SafeFileLoader.js'; // Conceptual Import for the new plugin
import {
    AJV_BASE_CONFIG,
    MINIMAL_FALLBACK_SCHEMA,
    DEFAULT_GOVERNANCE_SCHEMA_PATH
} from './schema/PolicySchemaDefinitions.js';

/**
 * Manages the loading, compilation, and validation of governance policies
 * against defined JSON schemas using a dedicated validation engine.
 * This centralizes high-assurance validation logic and decouples it from schema management.
 */
export class PolicyValidatorService {
    /**
     * @param {object} [dependencies] - Configuration dependencies for injection.
     * @param {Logger} [dependencies.logger] - Logger instance.
     * @param {string} [dependencies.defaultSchemaPath] - Override for primary schema path.
     * @param {SchemaValidationEngine} [dependencies.schemaEngine] - Pre-initialized validation engine.
     * @param {SafeFileLoader} [dependencies.fileLoader] - Utility for safe file loading.
     */
    constructor({
        logger = new Logger('PolicyValidator'),
        defaultSchemaPath = DEFAULT_GOVERNANCE_SCHEMA_PATH,
        schemaEngine = new SchemaValidationEngine(AJV_BASE_CONFIG),
        fileLoader = new SafeFileLoader({ logger })
    } = {}) {
        this.log = logger;
        this.schemaPath = defaultSchemaPath;

        // The validation engine handles AJV specifics (compilation, caching)
        this.schemaEngine = schemaEngine;
        this.fileLoader = fileLoader;

        // Define standardized IDs for easier management
        this.primarySchemaId = null;
        this.fallbackSchemaId = 'minimal-fallback-schema';

        // Pre-compile fallback schema immediately for emergency use
        try {
            this.schemaEngine.compileSchema(MINIMAL_FALLBACK_SCHEMA, this.fallbackSchemaId);
        } catch (e) {
            this.log.error('Failed to compile fallback schema:', e.message);
        }

        this.initialized = false;
    }

    /**
     * Attempts to load the primary governance schema from the defined path and compiles it.
     * If initialization fails, the service falls back to the minimal schema.
     * This method is idempotent and must be called before validate().
     * @returns {Promise<void>}
     */
    async initializeValidator() {
        if (this.initialized) {
            this.log.debug('Validator already initialized.');
            return;
        }

        try {
            this.log.debug(`Attempting to load primary schema from ${this.schemaPath}`);
            
            // Use abstracted file loading logic
            const primarySchema = await this.fileLoader.loadJson(
                this.schemaPath,
                'Primary Governance Schema'
            );

            const schemaId = primarySchema.$id || 'main-governance-schema';
            this.primarySchemaId = schemaId;

            // Delegation: Use the engine to compile and register the primary schema
            this.schemaEngine.compileSchema(primarySchema, schemaId);

            this.log.info(`Primary governance schema loaded successfully from ${this.schemaPath}`);

        } catch (error) {
            // Error messages are standardized and descriptive due to SafeFileLoader
            this.log.warn(`Initialization failed. ${error.message}. Falling back.`);

            // Set the active schema ID to the fallback ID
            this.primarySchemaId = this.fallbackSchemaId;
        } finally {
             this.initialized = true;
        }
    }

    /**
     * Validates a configuration object against the currently loaded primary schema (or fallback).
     * @param {object} config - The configuration object to validate.
     * @returns {{isValid: boolean, errors: Array<object>}} Validation result.
     * @throws {Error} If initializeValidator() has not been called.
     */
    validate(config) {
        if (!this.initialized) {
            throw new Error("Validator service must be initialized using initializeValidator() before calling validate().");
        }

        const activeSchemaId = this.primarySchemaId || this.fallbackSchemaId;

        // Delegation: Use the engine to execute validation
        const result = this.schemaEngine.validate(activeSchemaId, config);

        return result;
    }
}