// config/AxiomManager.js

// Constraints and Configuration Keys are strictly internal to the management process.
const AM_CONSTRAINTS = Object.freeze({
    KEY_LATEST_CERTIFIED: 'ACVD_latest_certified',
    MIN_UFRM_HARD_FLOOR: 0.1, // Unforeseen Risk Mitigation floor (Absolute minimum)
    MAX_CFTM_CEILING: 0.95   // Constraint Fulfillment Threshold Maximum (Absolute maximum)
});

/**
 * Axiom Manager (AM)
 * Responsible for lifecycle management and integrity of system policies,
 * specifically the Axiomatic Constraint Vector Definition (ACVD).
 * 
 * Dependencies: Logger, StorageProvider, and a dedicated ACVD Schema Validator.
 */
class AxiomManager {
    #storage;
    #logger;
    #ACVD = null; 
    #validator;

    /**
     * @param {Object} storageProvider - Handles persistence (must support fetch, write, updateAlias)
     * @param {Object} logger - Dedicated logging utility. 
     * @param {Object} acvdSchemaValidator - The required utility for structure enforcement.
     */
    constructor(storageProvider, logger, acvdSchemaValidator) {
        if (!storageProvider) {
            throw new Error("[AM:INIT] Storage provider dependency missing.");
        }
        if (!acvdSchemaValidator || typeof acvdSchemaValidator.validateStructure !== 'function') {
            throw new Error("[AM:INIT] Requires a valid ACVD Schema Validator utility with validateStructure().");
        }

        this.#storage = storageProvider; 
        this.#logger = logger || console; 
        this.#validator = acvdSchemaValidator; 
    }

    /** Checks if the foundational policy has been loaded. */
    get isInitialized() {
        return this.#ACVD !== null;
    }

    /**
     * Initializes the manager by loading the latest certified ACVD.
     * @throws {Error} if critical policy loading fails.
     */
    async initialize() {
        if (this.isInitialized) {
            this.#logger.warn("[AM:INIT] AxiomManager already initialized. Skipping.");
            return;
        }

        try {
            // _loadLatestACVD handles retrieval, validation, and returns a frozen object.
            this.#ACVD = await this._loadLatestACVD();
            this.#logger.info(`[AM:INIT] Initialized successfully with ACVD v${this.#ACVD.metadata.version}.`);
        } catch (error) {
            // Use a specific error type if available, otherwise generic Error.
            const criticalError = new Error("CRITICAL_POLICY_LOAD_FAILURE: Cannot establish foundational ACVD policy.");
            criticalError.originalError = error.message; 
            this.#logger.crit(`[AM:INIT] Initialization failed: ${error.message}`);
            throw criticalError; 
        }
    }

    /**
     * Internal routine to load ACVD from storage or generate defaults.
     * @returns {Object} A frozen ACVD object.
     * @private
     */
    async _loadLatestACVD() {
        this.#logger.debug("[AM] Attempting to load latest certified ACVD configuration.");
        
        const key = AM_CONSTRAINTS.KEY_LATEST_CERTIFIED;
        let rawConfig = null;

        try {
            rawConfig = await this.#storage.fetch(key); 
            
            if (!rawConfig) {
                this.#logger.warn("[AM] ACVD not found in storage. Generating and validating system defaults.");
                return this._getDefaultACVD(); // Returns frozen object
            }
            
            // Critical Step: Validate the retrieved structure against the schema
            this.#validator.validateStructure(rawConfig);
            
            // Freeze the loaded configuration for internal immutability
            return Object.freeze(rawConfig);

        } catch (error) {
            this.#logger.error(`[AM:LOAD] Failed to process or validate ACVD from storage (${key}): ${error.message}`);
            throw error; 
        }
    }

    /**
     * Generates a minimal, robust default ACVD. 
     * Ensures structural integrity via validation before freezing.
     * @private
     * @returns {Object} A frozen default ACVD.
     */
    _getDefaultACVD() {
        const defaultConfig = {
            metadata: { 
                version: 0, 
                creationDate: new Date().toISOString(),
                source: 'SYSTEM_DEFAULT',
                signature: 'NONE_GOVERNANCE_BYPASS' 
            },
            parameters: { 
                UFRM: AM_CONSTRAINTS.MIN_UFRM_HARD_FLOOR, 
                CFTM: AM_CONSTRAINTS.MAX_CFTM_CEILING 
            } 
        };
        
        // Ensure defaults pass structural checks immediately before system use.
        try {
             this.#validator.validateStructure(defaultConfig, true); 
        } catch (e) {
             this.#logger.fatal("[AM:DEFAULT] System default ACVD failed internal structural validation. Integrity compromised.");
             throw e;
        }

        return Object.freeze(defaultConfig);
    }

    /**
     * Core validation logic for a candidate ACVD.
     * @param {Object} candidateACVD - The proposed new configuration.
     * @throws {Error} If any validation rule fails (Structural, Version, or Parameter limits).
     */
    validateACVD(candidateACVD) {
        if (!this.isInitialized) {
             throw new Error("[AM:VALIDATE] AxiomManager not initialized. Cannot perform validation checks.");
        }
        
        // 1. Structural/Schema Validation (Delegated)
        this.#validator.validateStructure(candidateACVD); 
        
        const currentVersion = this.#ACVD.metadata.version;
        const candidateVersion = candidateACVD.metadata.version;

        // 2. Version Check: Must be strictly sequential and an integer.
        if (typeof candidateVersion !== 'number' || !Number.isInteger(candidateVersion) || candidateVersion <= currentVersion) {
            throw new Error(`Policy version mismatch: Candidate version (${candidateVersion}) must be a strict integer greater than current version (${currentVersion}).`);
        }
        
        // 3. Hard Limit Checks (Sanity Checks on critical Parameter values)
        const { UFRM, CFTM } = candidateACVD.parameters;

        if (UFRM < AM_CONSTRAINTS.MIN_UFRM_HARD_FLOOR) {
            this.#logger.alert(`[AM:VALIDATE] UFRM (${UFRM}) below absolute hard floor limit (${AM_CONSTRAINTS.MIN_UFRM_HARD_FLOOR}).`);
            throw new Error("Parameter violation: UFRM below hard policy floor limit.");
        }
        
        if (CFTM > AM_CONSTRAINTS.MAX_CFTM_CEILING) {
             this.#logger.alert(`[AM:VALIDATE] CFTM (${CFTM}) exceeds absolute hard ceiling limit (${AM_CONSTRAINTS.MAX_CFTM_CEILING}).`);
            throw new Error("Parameter violation: CFTM exceeds hard policy ceiling limit.");
        }
        
        return true;
    }

    /**
     * Applies a governance-approved ACVD and persists the new version immutably.
     * @param {Object} verifiedPackage - The policy package approved by CGR, typically containing { ACVD_Delta: Object }.
     */
    async certifyAndPersistACVD(verifiedPackage) {
        if (!this.isInitialized) {
             throw new Error("[AM:CERTIFY] AxiomManager not initialized.");
        }
        
        if (!verifiedPackage || !verifiedPackage.ACVD_Delta) {
             throw new Error("[AM:CERTIFY] Input package must contain verified ACVD_Delta.");
        }

        const verifiedACVD = verifiedPackage.ACVD_Delta; 

        try {
            // Full validation (structural, signature, version, parameters)
            this.validateACVD(verifiedACVD); 
        } catch (error) {
            this.#logger.error(`[AM:CERTIFY] Certification validation failed: ${error.message}`);
            throw new Error(`Cannot certify ACVD: Validation failed. ${error.message}`);
        }
        
        // Freeze before storing and assigning, guaranteeing immutability
        const frozenACVD = Object.freeze(verifiedACVD);

        this.#ACVD = frozenACVD;
        const versionKey = `ACVD_v${this.#ACVD.metadata.version}`; 
        
        // 1. Persist new version immutably 
        await this.#storage.write(versionKey, frozenACVD);
        
        // 2. Update the latest certified alias (pointer)
        await this.#storage.updateAlias(AM_CONSTRAINTS.KEY_LATEST_CERTIFIED, versionKey);
        
        this.#logger.info(`[AM:CERTIFY] Successfully certified and applied ACVD v${this.#ACVD.metadata.version}. Persistent key: ${versionKey}.`);
        return this.getCurrentACVD();
    }

    /**
     * Retrieves the current active Axiomatic Constraint Vector Definition (ACVD).
     * Returns the internal reference which is guaranteed to be frozen (immutable).
     * @returns {Object} A frozen, immutable copy of the current ACVD structure.
     */
    getCurrentACVD() {
        if (!this.isInitialized) {
             throw new Error("[AM:GET] AxiomManager not initialized. Policy is undetermined.");
        }
        // Return frozen internal state
        return this.#ACVD; 
    }
}

module.exports = AxiomManager;
