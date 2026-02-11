// Risk/Trust Policy Dynamic Configuration Manager (RTPCM)
// ID: RTPCM
// Scope: Governance Policy Input Layer
// Mandate: Provides a verified, versioned API for setting and reading the constants and weighting factors that underpin the P-01 Trust Calculus (S-01 and S-02 calculations).

/**
 * RTPCM: Manages verified, versioned, deeply immutable policy configurations for the Trust Calculus (P-01).
 * Implements strict versioning via content hashing, internal timeline tracking, and atomic configuration updates.
 */
class RTPCM {
    /**
     * @param {Object} deps - Explicit dependencies for governance operations.
     * @param {LedgerService} deps.ledger - D-01/MCR dependency for audited transaction logging.
     * @param {ConfigValidator} deps.validator - The Governance Rule Configuration Module (GRCM) validation utility.
     * @param {HashUtility} deps.hasher - Utility for generating cryptographic hashes of configuration states.
     * @param {Object} deps.integrityServiceTool - Utility providing canonicalStringify and deepFreeze.
     * @param {ImmutableConfigRegistry} [deps.registry] - Optional dependency injection of the registry plugin for testing/override.
     * @param {Object} [initialConfig={}] - Optional initial configuration settings.
     */
    constructor({ ledger, validator, hasher, integrityServiceTool, registry }, initialConfig = {}) {
        if (!ledger || !validator || !hasher || !integrityServiceTool) {
            throw new Error("RTPCM Initialization Error: Required dependencies (ledger, validator, hasher, integrityServiceTool) must be provided.");
        }

        // Dependencies
        this._ledger = ledger;
        this._validator = validator;
        
        // Configuration Registry Plugin (Abstracting storage, hashing, and immutability logic)
        this._registry = registry || new ImmutableConfigRegistry({ hasher, integrityServiceTool });

        // Bootstrap: Register initial configuration if provided.
        if (Object.keys(initialConfig).length > 0) {
            try {
                // Initial registration must be explicitly sourced as BOOTSTRAP_V0
                this.registerNewVersion(initialConfig, 'BOOTSTRAP_V0');
            } catch (e) {
                // Critical failure if initial config cannot be loaded or validated.
                throw new Error(`RTPCM Initialization Failed (CRITICAL): Initial configuration rejected. Details: ${e.message}`);
            }
        }
    }

    /**
     * Internal validation against established GRS stability policies and schema.
     * @param {Object} config 
     * @returns {boolean}
     */
    validateNewConfig(config) {
        return this._validator.validate(config);
    }

    /**
     * Logs the activation event to the Auditing Ledger (D-01/MCR).
     * @param {string} versionId
     * @param {Object} record
     */
    _auditActivation(versionId, record) {
        this._ledger.logTransaction('RTPCM_CONFIG_ACTIVATION', {
            ...record,
            details: `P-01 Trust Calculus parameters version ${versionId.substring(0, 8)} activated.`,
        });
    }

    /**
     * Registers a new configuration version, locking it (deep freeze), storing it historically, and logging.
     * @param {Object} newConfig - The proposed policy configuration.
     * @param {string} [source='API_CALL'] - Context/source of the update.
     * @returns {{versionId: string, config: Object, isNew: boolean}}
     * @throws {Error} If configuration validation fails.
     */
    registerNewVersion(newConfig, source = 'API_CALL') {
        if (!this.validateNewConfig(newConfig)) {
            throw new Error("RTPCM_GOV_ERROR: Configuration validation failed against Governance Rules Schema.");
        }

        // Delegate version registration, immutability, and history tracking to the registry plugin.
        // Pass the auditing function as a hook, allowing the plugin to handle the timing.
        const result = this._registry.register(
            newConfig, 
            source, 
            this._auditActivation.bind(this) 
        );
        
        return result;
    }

    /**
     * Retrieves the currently active configuration, packaged with its version identifier.
     * @returns {{versionId: string|null, config: Object|null}}
     */
    getActiveConfig() {
        return this._registry.getActiveConfig();
    }

    /**
     * Retrieves a specific historical configuration version by its hash ID.
     * @param {string} versionId - The hash of the desired configuration.
     * @returns {Object|null} The immutable configuration object, or null if not found locally.
     */
    getHistoricalConfig(versionId) {
        return this._registry.getHistoricalConfig(versionId);
    }

    /**
     * Retrieves the chronological timeline of configuration activations.
     * @returns {ReadonlyArray<Object>} Returns a deeply frozen timeline array.
     */
    getActivationTimeline() {
        return this._registry.getActivationTimeline();
    }

    /**
     * Exposed accessor for the ID of the currently active configuration.
     * @returns {string|null}
     */
    getActiveVersionId() {
        return this._registry.getActiveVersionId();
    }

    /**
     * Exposed accessor for calculating a hash for external verification (e.g., API response).
     * @param {Object} config
     * @returns {string}
     */
    calculateHash(config) {
        return this._registry.calculateHash(config);
    }
}

module.exports = RTPCM;