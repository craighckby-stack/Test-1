// Proposed Component: Certified Execution Artifact Generator (CEAG)
// Purpose: Transforms the Immutable Transaction Record (ITR) into a cryptographic executable payload.

// We remove the direct dependency on 'fs' (unused) and 'crypto' (now handled by the injected utility).

/**
 * Interface for the extracted cryptographic utility.
 * This interface is satisfied by the Integrity Utility Plugin.
 */
interface IntegrityHashingAndSigningUtilityInterface {
    hash(record: any): string;
    sign(payload: any, signingKey: string): string;
}

/**
 * @class CEAG
 * Manages the finalization of a successful governance proposal into an artifact ready for implementation.
 */
class CEAG {
    private signingKey: string;
    private artifactSchema: any;
    private cryptoUtility: IntegrityHashingAndSigningUtilityInterface;

    constructor(trustLayerConfig: { SIGNING_KEY_PRIVATE: string, CEAG_SCHEMA: any }, cryptoUtilityInstance?: IntegrityHashingAndSigningUtilityInterface) {
        this.signingKey = trustLayerConfig.SIGNING_KEY_PRIVATE;
        this.artifactSchema = trustLayerConfig.CEAG_SCHEMA;
        
        // Dependency Injection for Testability and Abstraction
        if (cryptoUtilityInstance) {
             this.cryptoUtility = cryptoUtilityInstance;
        } else {
             // Fallback instantiation, assuming the utility (now provided by plugin) is available in the environment.
             this.cryptoUtility = new (globalThis as any).IntegrityHashingAndSigningUtility(); 
        }
    }

    /**
     * Creates the final certified execution artifact.
     * @param {object} immutableTransactionRecord - The ITR output from GSEP-C L8.
     * @returns {object} Certified execution payload.
     */
    generateArtifact(immutableTransactionRecord: { validated_payload: any, context: any, p01_seal_valid?: boolean }): { certifiedPayload: object, signature: string, manifestVersion: string } {
        if (!this.validateITR(immutableTransactionRecord)) {
            throw new Error("ITR failed internal structural validation. Seal validation required.");
        }

        const timestamp = new Date().toISOString();
        
        // Step 1: Hash the entire record using the extracted utility
        const itrHash = this.cryptoUtility.hash(immutableTransactionRecord);

        const payload = {
            ITR_HASH: itrHash,
            ITR_TIMESTAMP: timestamp,
            PROPOSAL_CONTEXT: immutableTransactionRecord.context, // Assumes context is preserved
            EXECUTION_PARAMS: immutableTransactionRecord.validated_payload
        };

        // Step 2: Sign the resulting payload using the extracted utility
        const signature = this.cryptoUtility.sign(payload, this.signingKey);

        return {
            certifiedPayload: payload,
            signature: signature,
            manifestVersion: 'CEAG-V1'
        };
    }

    /**
     * Placeholder validation check for the ITR.
     * Must ensure L7/P-01 Seal is present and valid.
     * @param {object} record 
     * @returns {boolean}
     */
    private validateITR(record: { p01_seal_valid?: boolean }): boolean {
        // TODO: Integrate dedicated structural schema validator (e.g., StructuralSchemaValidatorTool) here.
        return record && record.p01_seal_valid === true;
    }
}

export = CEAG;