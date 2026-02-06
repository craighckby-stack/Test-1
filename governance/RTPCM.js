// Risk/Trust Policy Dynamic Configuration Manager (RTPCM)
// ID: RTPCM
// Scope: Governance Policy Input Layer
// Mandate: Provides a verified, versioned API for setting and reading the constants and weighting factors that underpin the P-01 Trust Calculus (S-01 and S-02 calculations).

/**
 * RTPCM: Manages verified, versioned policy configurations for the Trust Calculus (P-01).
 * Implements strict versioning, internal history tracking, and atomic configuration updates.
 */
class RTPCM {
    /**
     * @param {Object} deps - Explicit dependencies for governance operations.
     * @param {LedgerService} deps.ledger - D-01/MCR dependency for audited transaction logging.
     * @param {ConfigValidator} deps.validator - The Governance Rule Configuration Module (GRCM) validation utility.
     * @param {HashUtility} deps.hasher - Utility for generating cryptographic hashes of configuration states.
     * @param {Object} [initialConfig={}] - Optional initial configuration settings.
     */
    constructor({ ledger, validator, hasher }, initialConfig = {}) {
        if (!ledger || !validator || !hasher) {
            throw new Error("RTPCM Initialization Error: Required dependencies (ledger, validator, hasher) must be provided.");
        }
        
        // Internal State Management for Version Control and History
        this._configHistory = new Map(); // Stores { versionId: frozenConfig }
        this._currentVersionId = null;

        // Dependencies
        this._ledger = ledger;
        this._validator = validator;
        this._hasher = hasher;

        // Bootstrap: Register initial configuration if provided.
        if (Object.keys(initialConfig).length > 0) {
            try {
                // Use 'BOOTSTRAP' source tag for audit trail clarity.
                this.registerNewVersion(initialConfig, 'BOOTSTRAP');
            } catch (e) {
                // Critical failure if initial config cannot be loaded or validated.
                throw new Error(`RTPCM Initialization Failed: Initial configuration rejected. Details: ${e.message}`);
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
     * Generates a deterministic hash of the configuration object.
     * Serves as the official version identifier.
     * @param {Object} config 
     * @returns {string} The configuration hash (version ID).
     */
    calculateHash(config) {
        return this._hasher.digest(JSON.stringify(config));
    }

    /**
     * Registers a new configuration version, locking it, storing it historically, and logging to the AIA ledger.
     * If the configuration is identical to the currently active one, the update is skipped to maintain ledger fidelity.
     * @param {Object} newConfig - The proposed policy configuration.
     * @param {string} [source='API_CALL'] - Context/source of the update (e.g., BOOTSTRAP, UI_ADMIN).
     * @returns {{versionId: string, config: Object}} The cryptographic hash and the registered config.
     * @throws {Error} If configuration validation fails.
     */
    registerNewVersion(newConfig, source = 'API_CALL') {
        if (!this.validateNewConfig(newConfig)) {
            throw new Error("RTPCM_GOV_ERROR: Configuration validation failed against Governance Rules.");
        }
        
        const configHash = this.calculateHash(newConfig);

        if (configHash === this._currentVersionId) {
            return { versionId: configHash, config: this.getHistoricalConfig(configHash) };
        }

        // 1. Atomically store and lock (Immutability is critical for audit trails)
        const frozenConfig = Object.freeze(newConfig); // NOTE: Consumers must ensure structural immutability (deep freezing is external responsibility)
        this._configHistory.set(configHash, frozenConfig);
        
        // 2. Activation
        this._currentVersionId = configHash;
        
        // 3. Auditing
        this._ledger.logTransaction('RTPCM_CONFIG_UPDATE', {
            version: configHash,
            timestamp: Date.now(),
            source: source,
            details: 'P-01 Trust Calculus parameters activated.',
        });
        
        return { versionId: configHash, config: frozenConfig };
    }

    /**
     * Retrieves the currently active configuration, packaged with its version identifier.
     * @returns {{versionId: string|null, config: Object}} The active configuration and its ID. Returns safe defaults if not configured.
     */
    getActiveConfig() {
        if (!this._currentVersionId) {
            return { versionId: null, config: {} }; 
        }
        const config = this._configHistory.get(this._currentVersionId);
        return { versionId: this._currentVersionId, config: config };
    }

    /**
     * Retrieves a specific historical configuration version by its hash ID.
     * Useful for simulations, comparisons, or rollbacks.
     * @param {string} versionId - The hash of the desired configuration.
     * @returns {Object|null} The immutable configuration object, or null if not found locally.
     */
    getHistoricalConfig(versionId) {
        return this._configHistory.get(versionId) || null;
    }
}

module.exports = RTPCM;