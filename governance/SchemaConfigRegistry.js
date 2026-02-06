/**
 * SCR (Schema and Configuration Registry) - v94.1 Intelligence Update
 * Mission: Centralized Governance for AOC Schemas, Version Control, and Constraint Threshold Management.
 * Refactored for mandated asynchronous operation, decoupled governance, robust caching with race condition prevention,
 * and explicit configuration registration capability.
 */
class SchemaConfigRegistry {
    /**
     * @param {object} dependencies - Object containing required dependencies.
     * @param {object} dependencies.persistenceLayer - Responsible for immutable storage and retrieval.
     * @param {object} dependencies.authorizationService - Enforces P-01 and other governance mandates.
     * @param {object} dependencies.integrityUtils - Utility for cryptographic hashing (e.g., calculating content SHA).
     */
    constructor({ persistenceLayer, authorizationService, integrityUtils }) {
        if (!persistenceLayer || !authorizationService || !integrityUtils) {
            throw new Error("SCR requires PersistenceLayer, GovernanceAuthorizationService, and IntegrityUtils initialization.");
        }
        
        // Operational caches (L1)
        this._schemaCache = new Map(); 
        this._configCache = new Map(); 
        
        // Thundering Herd Prevention: Stores Promises for items currently being fetched from persistence.
        this._pendingLoads = new Map(); 

        this._persistenceLayer = persistenceLayer;
        this._authorizationService = authorizationService;
        this._integrityUtils = integrityUtils; 
    }

    /**
     * Internal handler to check authorization against required AOC security policy.
     * @param {string} operation - The registry operation (e.g., 'REGISTER_SCHEMA').
     * @param {object} [context={}] - Authorization context or token.
     */
    async _checkAuthorization(operation, context = {}) {
        // Elevated security clearance required for any write operation
        const requiredLevel = (operation.startsWith('REGISTER_')) ? 'L4_P01_PASS' : 'READ_ACCESS';
        const isAuthorized = await this._authorizationService.validate(requiredLevel, context);
        
        if (!isAuthorized) {
            throw new SchemaConfigRegistry.AuthorizationError(
                `Operation forbidden (${operation}): Required clearance ${requiredLevel}.`
            );
        }
    }

    /**
     * Generates a unique, content-integrity aware version identifier (V[EpochIndex]-[ContentHashPrefix]).
     * @param {object} content - The content being versioned.
     * @returns {Promise<string>} The version identifier.
     */
    async _generateVersion(content) {
        const contentString = JSON.stringify(content);
        // Using injected integrity utility for robust, non-mocked hashing
        const integrityHash = await this._integrityUtils.calculateContentHash(contentString);
        const hashPrefix = integrityHash.substring(0, 12);
        const epochIndex = Math.floor(Date.now() / 10000); 
        return `V${epochIndex}-${hashPrefix}`;
    }

    /**
     * Retrieves data from persistence, ensuring only one fetch occurs per key at a time (Load Barrier).
     * @param {string} type - 'schema' or 'config'.
     * @param {string} id - The unique identifier.
     * @returns {Promise<object>} The loaded record (or its definition/data).
     */
    async _loadFromPersistenceWithBarrier(type, id) {
        const key = `${type}:${id}`;
        
        if (this._pendingLoads.has(key)) {
            return this._pendingLoads.get(key);
        }

        const loadPromise = (async () => {
            try {
                let record;
                if (type === 'schema') {
                    record = await this._persistenceLayer.loadSchema(id);
                } else { // config
                    record = await this._persistenceLayer.loadConfig(id);
                }
                
                if (!record) {
                    throw new SchemaConfigRegistry.RegistryError(`${type} ${id} not found.`);
                }
                
                // Update appropriate cache and return specific content
                if (type === 'schema') {
                    this._schemaCache.set(id, record);
                    return record.definition;
                } else { 
                    this._configCache.set(id, record);
                    return record;
                }
            } finally {
                this._pendingLoads.delete(key);
            }
        })();

        this._pendingLoads.set(key, loadPromise);
        return loadPromise;
    }

    // --- Schema Operations ---

    /**
     * Registers or updates a schema definition.
     * Requires L4 P-01 authorization validation.
     * @param {string} schemaId - The identifier (e.g., 'C-FRAME-V1').
     * @param {object} schemaDefinition - The JSON schema structure.
     * @param {object} [authContext={}] - Authorization context for the write operation.
     * @returns {Promise<string>} The new version identifier.
     */
    async registerSchema(schemaId, schemaDefinition, authContext = {}) {
        await this._checkAuthorization('REGISTER_SCHEMA', authContext);

        const record = {
            id: schemaId,
            definition: schemaDefinition,
            version: await this._generateVersion(schemaDefinition),
            timestamp: Date.now()
        };

        await this._persistenceLayer.saveSchema(schemaId, record);
        this._schemaCache.set(schemaId, record);

        return record.version;
    }

    /**
     * Retrieves the latest active schema definition from cache or persistence.
     * Utilizes Load Barrier to prevent concurrent persistence hits.
     * @param {string} schemaId - Identifier.
     * @returns {Promise<object>} The schema definition.
     */
    async getLatestSchema(schemaId) {
        if (this._schemaCache.has(schemaId)) {
            return this._schemaCache.get(schemaId).definition;
        }

        // The barrier handler returns the definition directly for schemas
        return this._loadFromPersistenceWithBarrier('schema', schemaId);
    }
    
    // --- Configuration Operations ---

    /**
     * Registers or updates system configuration data (e.g., P-01 constraint vectors).
     * Requires L4 P-01 authorization validation. Configuration data is versioned.
     * @param {string} configId - Identifier (e.g., 'P01_DECISION_THRESHOLDS').
     * @param {object} configData - The configuration parameters.
     * @param {object} [authContext={}] - Authorization context for the write operation.
     * @returns {Promise<string>} The new version identifier.
     */
    async registerConfig(configId, configData, authContext = {}) {
        await this._checkAuthorization('REGISTER_CONFIG', authContext);

        const record = {
            id: configId,
            data: configData,
            version: await this._generateVersion(configData),
            timestamp: Date.now()
        };
        
        await this._persistenceLayer.saveConfig(configId, record);
        this._configCache.set(configId, record);

        return record.version;
    }

    /**
     * Retrieves P-01 constraint vectors or other system configuration data.
     * Utilizes Load Barrier to prevent concurrent persistence hits.
     * @param {string} configId - Identifier (e.g., 'P01_DECISION_THRESHOLDS').
     * @returns {Promise<object>} Configuration parameters (the data property of the stored record).
     */
    async getConfig(configId) {
        if (this._configCache.has(configId)) {
            return this._configCache.get(configId).data;
        }

        const record = await this._loadFromPersistenceWithBarrier('config', configId);
        return record.data;
    }

    // --- Static Error Handlers ---
    static AuthorizationError = class extends Error { constructor(message) { super(message); this.name = 'SCR_AuthorizationError'; } };
    static RegistryError = class extends Error { constructor(message) { super(message); this.name = 'SCR_RegistryError'; } };
}

module.exports = SchemaConfigRegistry;