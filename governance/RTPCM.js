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
     * @param {ObjectUtils} [deps.objectUtils] - Utility for canonicalization and deep freezing (proposed scaffold).
     * @param {Object} [initialConfig={}] - Optional initial configuration settings.
     */
    constructor({ ledger, validator, hasher, objectUtils }, initialConfig = {}) {
        if (!ledger || !validator || !hasher) {
            throw new Error("RTPCM Initialization Error: Required dependencies (ledger, validator, hasher) must be provided.");
        }
        
        // Internal State Management for Version Control and History
        this._configRegistry = new Map();   // Stores { versionId: deepFrozenConfig }
        this._activationTimeline = [];     // Tracks activation sequence: [{ versionId, timestamp, source }]
        this._activeVersionId = null;

        // Dependencies
        this._ledger = ledger;
        this._validator = validator;
        this._hasher = hasher;
        this._objectUtils = objectUtils;

        // Safety check for critical utilities needed for governance fidelity
        if (this._objectUtils && (!this._objectUtils.canonicalStringify || !this._objectUtils.deepFreeze)) {
             throw new Error("RTPCM Initialization Error: ObjectUtils must provide canonicalStringify and deepFreeze methods.");
        }

        // Bootstrap: Register initial configuration if provided.
        if (Object.keys(initialConfig).length > 0) {
            try {
                this.registerNewVersion(initialConfig, 'BOOTSTRAP');
            } catch (e) {
                // Critical failure if initial config cannot be loaded or validated.
                throw new Error(`RTPCM Initialization Failed (Critical): Initial configuration rejected. Details: ${e.message}`);
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
     * Generates a deterministic, version-specific hash of the configuration object.
     * Utilizes canonical serialization to ensure hash consistency independent of key order.
     * @param {Object} config 
     * @returns {string} The configuration hash (version ID).
     */
    calculateHash(config) {
        let serializedConfig;
        
        if (this._objectUtils && this._objectUtils.canonicalStringify) {
            serializedConfig = this._objectUtils.canonicalStringify(config);
        } else {
            // Fallback for environment lacking Canonicalizer utility. WARNING issued.
            console.warn("RTPCM WARNING: Canonical JSON serialization utility missing. Using standard JSON.stringify which may lead to key-order instability in hashing.");
            serializedConfig = JSON.stringify(config);
        }

        return this._hasher.digest(serializedConfig);
    }

    /**
     * Registers a new configuration version, locking it (deep freeze), storing it historically, and logging to the AIA ledger.
     * @param {Object} newConfig - The proposed policy configuration.
     * @param {string} [source='API_CALL'] - Context/source of the update.
     * @returns {{versionId: string, config: Object}} The cryptographic hash and the registered config.
     * @throws {Error} If configuration validation fails.
     */
    registerNewVersion(newConfig, source = 'API_CALL') {
        if (!this.validateNewConfig(newConfig)) {
            throw new Error("RTPCM_GOV_ERROR: Configuration validation failed against Governance Rules.");
        }
        
        const configHash = this.calculateHash(newConfig);

        if (configHash === this._activeVersionId) {
            // Skip registration if content is identical to the currently active version.
            return { versionId: configHash, config: this.getHistoricalConfig(configHash) };
        }

        // 1. Enforce Deep Immutability.
        let frozenConfig;
        if (this._objectUtils && this._objectUtils.deepFreeze) {
            frozenConfig = this._objectUtils.deepFreeze(newConfig);
        } else {
            // Critical governance warning if the utility is missing.
            console.error("RTPCM CRITICAL ERROR: Deep freeze utility missing. Relying only on shallow freeze.");
            frozenConfig = Object.freeze(newConfig);
        }

        this._configRegistry.set(configHash, frozenConfig);
        
        // 2. Activation and Timeline Update
        this._activeVersionId = configHash;
        const activationRecord = {
            versionId: configHash,
            timestamp: Date.now(),
            source: source,
        };
        this._activationTimeline.push(activationRecord);
        
        // 3. Auditing
        this._ledger.logTransaction('RTPCM_CONFIG_ACTIVATION', {
            ...activationRecord,
            details: `P-01 Trust Calculus parameters activated (Change Index: ${this._activationTimeline.length}).`,
        });
        
        return { versionId: configHash, config: frozenConfig };
    }

    /**
     * Retrieves the currently active configuration, packaged with its version identifier.
     * @returns {{versionId: string|null, config: Object|null, note?: string}} The active configuration and its ID.
     */
    getActiveConfig() {
        if (!this._activeVersionId) {
            // Return null config if unconfigured, with explicit zero-state note for clarity.
            return { versionId: null, config: null, note: "RTPCM unconfigured. Zero-state configuration applied." }; 
        }
        const config = this._configRegistry.get(this._activeVersionId);
        return { versionId: this._activeVersionId, config: config };
    }

    /**
     * Retrieves a specific historical configuration version by its hash ID.
     * @param {string} versionId - The hash of the desired configuration.
     * @returns {Object|null} The immutable configuration object, or null if not found locally.
     */
    getHistoricalConfig(versionId) {
        return this._configRegistry.get(versionId) || null;
    }

    /**
     * Retrieves the chronological timeline of configuration activations.
     * @returns {Array<Object>}
     */
    getActivationTimeline() {
        // Return a frozen clone to prevent modification of the internal timeline.
        return Object.freeze([...this._activationTimeline]);
    }
}

module.exports = RTPCM;