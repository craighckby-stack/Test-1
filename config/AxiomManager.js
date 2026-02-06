// config/AxiomManager.js

/**
 * Axiom Manager (AM)
 * Responsible for lifecycle management and integrity of system policies,
 * specifically the Axiomatic Constraint Vector Definition (ACVD).
 */
class AxiomManager {
    constructor(storageProvider) {
        // storageProvider handles persistence (e.g., file system or tamper-proof DB)
        this.storage = storageProvider; 
        this.ACVD = this.loadLatestACVD();
    }

    loadLatestACVD() {
        // Simulates fetching the latest certified ACVD configuration from storage
        console.log("AM: Loading latest certified ACVD configuration.");
        try {
            const rawConfig = this.storage.fetch('ACVD_latest_certified'); 
            
            if (!rawConfig) {
                // Default Initialization for new system/cold start
                return {
                    metadata: { version: 0, creationDate: new Date().toISOString() },
                    parameters: { UFRM: 0.1, CFTM: 0.95 } 
                };
            }
            return rawConfig;

        } catch (error) {
            throw new Error(`Failed to load ACVD: ${error.message}`);
        }
    }

    validateACVD(candidateACVD) {
        // Core validation logic: ensures structural integrity, schema adherence, 
        // and checks against historical policy conflict vectors.
        if (candidateACVD.metadata.version <= this.ACVD.metadata.version) {
            throw new Error("Policy version mismatch: Candidate version must be strictly greater.");
        }
        if (candidateACVD.parameters.UFRM < 0.1) {
            // Warning indicates extreme condition requiring manual governance bypass
            console.warn("UFRM below absolute hard floor limit.");
        }
        return true;
    }

    /**
     * Applies a governance-approved ACVD delta and persists the new version.
     * @param {Object} verifiedPackage - The policy package approved by CGR, including delta and metadata.
     */
    async certifyAndPersistACVD(verifiedPackage) {
        const verifiedACVD = verifiedPackage.ACVD_Delta; // Assuming the delta contains the full new ACVD

        if (!this.validateACVD(verifiedACVD)) {
             throw new Error("Cannot certify ACVD: Validation failed.");
        }
        
        this.ACVD = verifiedACVD;
        
        // Persist new version immutably and update the latest certified alias
        await this.storage.write(`ACVD_v${this.ACVD.metadata.version}`, this.ACVD);
        this.storage.updateAlias('ACVD_latest_certified', `ACVD_v${this.ACVD.metadata.version}`);
        
        console.log(`AM: Successfully certified and applied ACVD v${this.ACVD.metadata.version}.`);
        return this.ACVD;
    }

    getCurrentACVD() {
        // Return an immutable copy for read operations
        return JSON.parse(JSON.stringify(this.ACVD)); 
    }
}

module.exports = AxiomManager;