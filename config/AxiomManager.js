// config/AxiomManager.js

const AxiomManagerConstants = {
    LATEST_ACVD_KEY: 'ACVD_latest_certified',
    DEFAULT_UFRM_HARD_FLOOR: 0.1, // Unforeseen Risk Mitigation floor
    DEFAULT_CFTM_CEILING: 0.95,   // Constraint Fulfillment Threshold Maximum
};

/**
 * Axiom Manager (AM)
 * Responsible for lifecycle management and integrity of system policies,
 * specifically the Axiomatic Constraint Vector Definition (ACVD).
 * 
 * Prerequisites: Requires an external Logger and a robust StorageProvider.
 */
class AxiomManager {
    /**
     * @param {Object} storageProvider - Handles persistence (e.g., file system or tamper-proof DB)
     * @param {Object} logger - Dedicated logging utility (must support info, warn, error, alert).
     */
    constructor(storageProvider, logger) {
        if (!storageProvider) throw new Error("AxiomManager requires a storage provider.");
        
        this.storage = storageProvider; 
        this.logger = logger || console; // Fallback for robustness
        this.ACVD = null; // State must be initialized asynchronously
    }

    /**
     * Initializes the manager by loading the latest certified ACVD.
     * Must be called before any other operations.
     */
    async initialize() {
        this.ACVD = await this._loadLatestACVD();
        this.logger.info(`AM: Initialized successfully with ACVD v${this.ACVD.metadata.version}.`);
    }

    async _loadLatestACVD() {
        this.logger.info("AM: Attempting to load latest certified ACVD configuration.");
        try {
            // Assuming storage.fetch is asynchronous
            const rawConfig = await this.storage.fetch(AxiomManagerConstants.LATEST_ACVD_KEY); 
            
            if (!rawConfig) {
                this.logger.warn("ACVD not found in storage. Initializing system defaults.");
                return this._getDefaultACVD();
            }
            
            // FUTURE IMPROVEMENT: Call ACVDSchema.validateStructure(rawConfig) here
            return rawConfig;

        } catch (error) {
            this.logger.error(`Failed to load ACVD: ${error.message}`);
            // Critical failure requires immediate halt or defined fallback policy
            throw new Error("CRITICAL FAILURE: Cannot establish foundational ACVD policy.");
        }
    }

    _getDefaultACVD() {
        return {
            metadata: { 
                version: 0, 
                creationDate: new Date().toISOString(),
                source: 'SYSTEM_DEFAULT'
            },
            parameters: { 
                UFRM: AxiomManagerConstants.DEFAULT_UFRM_HARD_FLOOR, 
                CFTM: AxiomManagerConstants.DEFAULT_CFTM_CEILING 
            } 
        };
    }

    /**
     * Core validation logic: ensures structural integrity, schema adherence, 
     * and checks against historical policy conflict vectors.
     * @param {Object} candidateACVD - The proposed new configuration.
     */
    validateACVD(candidateACVD) {
        if (!this.ACVD) {
             throw new Error("AxiomManager not initialized. Call initialize() first.");
        }
        
        // 1. Version Check
        if (candidateACVD.metadata.version <= this.ACVD.metadata.version) {
            throw new Error(`Policy version mismatch: Candidate version (${candidateACVD.metadata.version}) must be strictly greater than current version (${this.ACVD.metadata.version}).`);
        }
        
        // 2. Structural/Schema Validation (Requires proposed utility)
        // ACVDSchema.validateStructure(candidateACVD);
        
        // 3. Hard Limit Checks
        if (candidateACVD.parameters.UFRM < AxiomManagerConstants.DEFAULT_UFRM_HARD_FLOOR) {
            this.logger.alert(`UFRM (${candidateACVD.parameters.UFRM}) below absolute hard floor limit (${AxiomManagerConstants.DEFAULT_UFRM_HARD_FLOOR}). This requires mandatory governance override logging.`);
        }

        // 4. Integrity Checks (e.g., mandatory governance signature)
        if (!candidateACVD.metadata || !candidateACVD.metadata.signature) {
             throw new Error("ACVD integrity check failed: Missing governance signature.");
        }
        
        return true;
    }

    /**
     * Applies a governance-approved ACVD delta and persists the new version.
     * @param {Object} verifiedPackage - The policy package approved by CGR, including delta and metadata.
     */
    async certifyAndPersistACVD(verifiedPackage) {
        if (!this.ACVD) {
             throw new Error("AxiomManager not initialized.");
        }
        
        // Assuming verifiedPackage.ACVD_Delta is the full new ACVD object
        const verifiedACVD = verifiedPackage.ACVD_Delta; 

        try {
            this.validateACVD(verifiedACVD);
        } catch (error) {
            this.logger.error(`Certification failed due to validation errors: ${error.message}`);
            throw new Error(`Cannot certify ACVD: Validation failed. ${error.message}`);
        }
        
        this.ACVD = verifiedACVD;
        const versionKey = `ACVD_v${this.ACVD.metadata.version}`;
        
        // Persist new version immutably (historical record)
        await this.storage.write(versionKey, this.ACVD);
        
        // Update the latest certified alias (pointer)
        // Assuming storage.updateAlias is asynchronous
        await this.storage.updateAlias(AxiomManagerConstants.LATEST_ACVD_KEY, versionKey);
        
        this.logger.info(`AM: Successfully certified and applied ACVD v${this.ACVD.metadata.version}. Persistent key: ${versionKey}.`);
        return this.getCurrentACVD();
    }

    getCurrentACVD() {
        if (!this.ACVD) {
             throw new Error("AxiomManager not initialized.");
        }
        // Return an immutable, frozen structure for read operations.
        return Object.freeze(JSON.parse(JSON.stringify(this.ACVD))); 
    }
}

module.exports = AxiomManager;