import path from 'path';
import Logger from './Logger.js';
// Import the newly abstracted asynchronous data loader utility
import ImmutableAsyncDataStore from './ImmutableAsyncDataStore.js';

const DEFAULT_SPEC_PATH = path.resolve(process.cwd(), 'config/XEL_Specification.json');
// Freeze the fallback structure to guarantee immutability and consistency
const FALLBACK_SPEC = Object.freeze({
    ComponentSchemas: Object.freeze({})
});

/**
 * Specification Loader Service: Manages the loading, parsing, and version control
 * of XEL Specifications, leveraging an asynchronous data store for I/O separation.
 */
class SpecificationLoader {
    // Private fields for strict encapsulation of state and dependencies
    #specPath;
    #logger;
    #store;

    /**
     * @param {{ specPath?: string }} config Configuration object.
     */
    constructor(config = {}) {
        this.#specPath = config.specPath || DEFAULT_SPEC_PATH;
        this.#logger = new Logger('SpecificationLoader');

        // Refactored: Delegate store instantiation and validation
        this.#store = this.#getValidatedStore(this.#specPath, this.#logger);
    }

    /**
     * Synchronously resolves, instantiates, and validates the required
     * ImmutableAsyncDataStore dependency.
     *
     * @param {string} specPath The path to the specification file.
     * @param {Logger} logger The logger instance.
     * @returns {ImmutableAsyncDataStore} The validated store instance.
     * @private
     */
    #getValidatedStore(specPath, logger) {
        // Use the abstracted store for I/O and state management
        const store = new ImmutableAsyncDataStore(specPath, logger);

        if (!store) {
             throw new Error("[SpecificationLoader Setup] Failed to instantiate ImmutableAsyncDataStore dependency.");
        }
        return store;
    }

    /**
     * Initializes the loader by asynchronously reading and parsing the specification file.
     * Must be awaited by the system bootstrapping process.
     * @returns {Promise<void>}
     */
    async initialize() {
        this.#logger.info(`Attempting initialization of specification store: ${this.#specPath}`);

        try {
            // Pass the domain-specific fallback structure to the underlying store
            await this.#store.initialize(FALLBACK_SPEC);
            this.#logger.success("XEL Specification initialized successfully.");
        } catch (error) {
            // Log failure internally and re-throw a domain-specific, standardized failure message
            this.#logger.error(`SPEC_LOAD_FAILURE: Initialization failed for ${this.#specPath}`, error);
            throw new Error(`[SPEC_LOAD_FAILURE] Initialization failed: ${error.message}`);
        }
    }

    /**
     * Retrieves the complete specification object (deep cloned for safety).
     * @returns {object}
     */
    getSpecification() {
        // Delegate data retrieval to the store
        return this.#store.getData();
    }

    /**
     * Retrieves the Component Schemas section of the specification.
     * @returns {object}
     */
    getComponentSchemas() {
        const spec = this.getSpecification();

        if (!spec.ComponentSchemas) {
             throw new Error("[SPEC_STRUCTURE_ERROR] Specifications initialized but 'ComponentSchemas' structure is missing.");
        }
        return spec.ComponentSchemas;
    }

    // FUTURE: Implement checkSpecificationVersion(v), hotReload(newPath), validateSelf()...
}

// Export the class definition for external lifecycle management (initiation and awaiting).
export default SpecificationLoader;
