/**
 * SCR (Schema and Configuration Registry) - v94.1 Intelligence Update
 * Mission: Centralized Governance for AOC Schemas, Version Control, and Constraint Threshold Management.
 *
 * The SCR acts as the single source of truth for all structured inputs and artifact outputs utilized
 * by ASDM and GCO. Refactored for mandated asynchronous operation, decoupled governance, and robust caching.
 */
class SchemaConfigRegistry {
    /**
     * @param {object} persistenceLayer - Responsible for immutable storage and retrieval.
     * @param {object} authorizationService - Enforces P-01 and other governance mandates.
     */
    constructor(persistenceLayer, authorizationService) {
        // SCR state acts primarily as an L1 operational cache layer.
        this.schemaCache = new Map(); 
        this.configCache = new Map(); 
        
        if (!persistenceLayer || !authorizationService) {
            throw new Error("SCR requires PersistenceLayer and GovernanceAuthorizationService initialization.");
        }
        this.persistenceLayer = persistenceLayer;
        this.authorizationService = authorizationService;
    }

    /**
     * Internal handler to check authorization against required AOC security policy (e.g., P-01 Level 4).
     * @param {string} operation - The registry operation (e.g., 'REGISTER_SCHEMA').
     * @param {object} [context={}] - Authorization context or token.
     */
    async _checkAuthorization(operation, context = {}) {
        // Only schema registration is currently deemed L4 critical write operation.
        const requiredLevel = (operation === 'REGISTER_SCHEMA') ? 'L4_P01_PASS' : 'READ_ACCESS';
        const isAuthorized = await this.authorizationService.validate(requiredLevel, context);
        
        if (!isAuthorized) {
            throw new SchemaConfigRegistry.AuthorizationError(
                `Operation forbidden (${operation}): Required clearance ${requiredLevel}.`
            );
        }
    }

    /**
     * Generates a unique, content-integrity aware version identifier.
     * V[EpochIndex]-[ContentHashPrefix]
     * @param {object} content - The content being versioned.
     */
    _generateVersion(content) {
        const contentString = JSON.stringify(content);
        // SHA-256 placeholder logic to ensure integrity tracking is baked into the version ID.
        const integrityHash = SchemaConfigRegistry.Utilities.sha256(contentString).substring(0, 12);
        const epochIndex = Math.floor(Date.now() / 10000); 
        return `V${epochIndex}-${integrityHash}`;
    }

    /**
     * Registers or updates a schema definition (e.g., C-FRAME-V1 JSON Schema).
     * Requires L4 P-01 authorization validation via the GovernanceAuthorizationService.
     * @param {string} schemaId - The identifier (e.g., 'C-FRAME-V1').
     * @param {object} schemaDefinition - The JSON schema structure.
     * @param {object} [authContext={}] - Authorization context for the write operation.
     */
    async registerSchema(schemaId, schemaDefinition, authContext = {}) {
        await this._checkAuthorization('REGISTER_SCHEMA', authContext);

        const record = {
            id: schemaId,
            definition: schemaDefinition,
            version: this._generateVersion(schemaDefinition),
            timestamp: Date.now()
        };

        // Write to persistence first to ensure immutability and durability
        await this.persistenceLayer.saveSchema(schemaId, record);
        
        // Update operational cache
        this.schemaCache.set(schemaId, record);

        return record.version;
    }

    /**
     * Retrieves the latest active schema definition from cache or persistence.
     * @param {string} schemaId - Identifier.
     * @returns {Promise<object>} The schema definition.
     */
    async getLatestSchema(schemaId) {
        if (this.schemaCache.has(schemaId)) {
            return this.schemaCache.get(schemaId).definition;
        }

        // Load latest version from persistence layer
        const record = await this.persistenceLayer.loadSchema(schemaId);
        if (!record) {
            throw new SchemaConfigRegistry.RegistryError(`Schema ${schemaId} not found.`);
        }
        
        this.schemaCache.set(schemaId, record);
        return record.definition;
    }
    
    /**
     * Retrieves P-01 constraint vectors or other system configuration data.
     * @param {string} configId - Identifier (e.g., 'P01_DECISION_THRESHOLDS').
     * @returns {Promise<object>} Configuration parameters.
     */
    async getConfig(configId) {
        if (this.configCache.has(configId)) {
            return this.configCache.get(configId);
        }

        const config = await this.persistenceLayer.loadConfig(configId);
        if (!config) {
             throw new SchemaConfigRegistry.RegistryError(`Configuration ${configId} not found.`);
        }
        
        this.configCache.set(configId, config);
        return config;
    }

    // --- Static Utility Classes and Errors ---
    static AuthorizationError = class extends Error { constructor(message) { super(message); this.name = 'SCR_AuthorizationError'; } };
    static RegistryError = class extends Error { constructor(message) { super(message); this.name = 'SCR_RegistryError'; } };
    
    static Utilities = {
        sha256: (data) => {
            // Mock cryptographic function placeholder
            let hash = 0;
            if (data.length === 0) return '000000000000';
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0;
            }
            return Math.abs(hash).toString(16).padStart(12, '0');
        }
    };
}

module.exports = SchemaConfigRegistry;