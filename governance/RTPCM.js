// Risk/Trust Policy Dynamic Configuration Manager (RTPCM)
// ID: RTPCM
// Scope: Governance Policy Input Layer
// Mandate: Provides a verified, versioned API for setting and reading the constants and weighting factors that underpin the P-01 Trust Calculus (S-01 and S-02 calculations).

/**
 * RTPCM: Manages verified, versioned policy configurations for the Trust Calculus (P-01).
 * Dependencies are explicitly injected to enforce architectural rigor, testability, and clarity.
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
        
        this._policyConfig = initialConfig;
        this._ledger = ledger;
        this._validator = validator;
        this._hasher = hasher;
    }

    /**
     * Internal validation against established GRS stability policies and schema.
     * Delegates validation to the injected service (formerly relying on global RGCM).
     * @param {Object} config 
     * @returns {boolean}
     */
    validateNewConfig(config) {
        return this._validator.validate(config);
    }

    /**
     * Generates a deterministic hash of the configuration object.
     * Ensures integrity and serves as the official version identifier.
     * @param {Object} config 
     * @returns {string} The configuration hash (version ID).
     */
    calculateHash(config) {
        // Utilize the injected cryptographic hash utility
        return this._hasher.digest(JSON.stringify(config));
    }

    /**
     * Registers a new configuration version, locking it and logging the transaction to the AIA ledger.
     * @param {Object} newConfig - The proposed policy configuration.
     * @returns {string} The cryptographic hash (version ID) of the new configuration.
     * @throws {Error} If configuration validation fails.
     */
    registerNewVersion(newConfig) {
        // Pre-flight check: Enforce governance stability policies.
        if (!this.validateNewConfig(newConfig)) {
            throw new Error("RTPCM_GOV_ERROR: Configuration validation failed against Governance Rules.");
        }
        
        // Atomically update and lock the configuration (Immutability is critical for audit trails)
        this._policyConfig = Object.freeze(newConfig); 
        const configHash = this.calculateHash(newConfig);
        
        // Log the definitive, locked policy version.
        this._ledger.logTransaction('RTPCM_CONFIG_UPDATE', {
            version: configHash,
            timestamp: Date.now(),
            details: 'P-01 Trust Calculus parameters updated.',
        });
        
        return configHash;
    }

    /**
     * Retrieves the currently active configuration, used by downstream modules (C-11, ATM).
     * @returns {Object} The active, immutable configuration object.
     */
    getActiveConfig() {
        return this._policyConfig;
    }
}

module.exports = RTPCM;