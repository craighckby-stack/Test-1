class ArchitectureSchemaRegistrar {
    /**
     * Initializes the registrar with a high-performance Map.
     */
    constructor() {
        // O(1) lookup, insertion, and deletion for maximum efficiency.
        this._schemas = new Map();
    }

    /**
     * Registers an architecture schema definition.
     * @param {string} name - The unique identifier for the schema.
     * @param {object} schemaDefinition - The schema structure (e.g., JSON schema).
     * @returns {boolean} True if successfully registered, false if already exists.
     */
    register(name, schemaDefinition) {
        if (!name || this._schemas.has(name)) {
            return false;
        }
        this._schemas.set(name, schemaDefinition);
        return true;
    }

    /**
     * Retrieves a registered schema definition.
     * @param {string} name - The unique identifier.
     * @returns {object | undefined} The schema definition or undefined.
     */
    get(name) {
        return this._schemas.get(name);
    }

    /**
     * Checks for the existence of a schema.
     * @param {string} name - The unique identifier.
     * @returns {boolean}
     */
    has(name) {
        return this._schemas.has(name);
    }

    /**
     * Returns an iterator over all registered schema names.
     * @returns {IterableIterator<string>}
     */
    keys() {
        return this._schemas.keys();
    }
}

// Export a singleton instance to ensure a single source of truth across the kernel.
const registrarInstance = new ArchitectureSchemaRegistrar();
export default registrarInstance;