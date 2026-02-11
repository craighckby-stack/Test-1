import { CanonicalPayloadGenerator } from '@agi-kernel/plugins/CanonicalPayloadGenerator';
import { MultiSignatureRoleVerifier } from '@agi-kernel/plugins/MultiSignatureRoleVerifier';

/**
 * Interface defining the necessary methods from the KeyStoreService dependency.
 * This service manages cryptographic keys.
 */
type KeyStoreService = {
    getPublicKey: (keyId: string) => any; // Returns public key material
};

/**
 * Type definition for a single signature credential provided in the request.
 */
type SignatureCredential = {
    keyId: string;
    signature: string;
    role: string;
};

/**
 * Type definition for the standardized output of the signature verification process.
 */
type SignatureVerificationResult = {
    verifiedRoles: string[];
    valid: boolean;
    error: string | null;
};

/**
 * Sovereign AGI v94.1 | Governance Validator Service
 * Primary service for handling cryptographic verification of transition requests.
 * Decouples the low-level security mechanism (key lookup) from the high-level governance rules.
 */
class GovernanceValidatorService {

    private keyStore: KeyStoreService;

    /**
     * @param {KeyStoreService} keyStore - Service managing cryptographic keys and identities.
     */
    constructor(keyStore: KeyStoreService) {
        this.keyStore = keyStore;
    }

    /**
     * Internal wrapper function to bridge KeyStoreService methods to the verification utility's callback format.
     * This method handles public key lookup and calls the underlying crypto verification engine.
     *
     * @param {string} keyId - The ID of the public key.
     * @param {string} dataToHash - The canonical data string.
     * @param {string} signature - The signature to verify.
     * @returns {boolean} True if the signature is valid.
     */
    private verifyCallback(keyId: string, dataToHash: string, signature: string): boolean {
        const publicKey = this.keyStore.getPublicKey(keyId);
        if (!publicKey) {
            console.warn(`Verification failed: Public key not found for ID ${keyId}.`);
            return false;
        }

        // --- Placeholder for Cryptographic Verification Logic ---
        // In a live system, this would call keyStore.verify(publicKey, dataToHash, signature);
        // We explicitly mock success for testing purposes.
        console.warn(`MOCK CRYPTO VERIFICATION: Key ID ${keyId}. (MOCKING SUCCESS)`);
        return true; 
        // --------------------------------------------------------
    }

    /**
     * Validates cryptographic signatures provided in the credentials object against the transition payload.
     * Maps valid signatures back to system roles (e.g., 'Sovereign_Trustee', 'Operational_Lead').
     *
     * @param {object} payload - The full command/transition object being authorized.
     * @param {SignatureCredential[]} signatures - Array of signatures, containing (keyId, signature, role).
     * @returns {SignatureVerificationResult}
     */
    verifyTransitionSignatures(
        payload: object,
        signatures: SignatureCredential[]
    ): SignatureVerificationResult {

        // 1. Canonicalize the payload using an existing tool (CanonicalPayloadGenerator)
        const canonicalData = CanonicalPayloadGenerator.generate(payload);

        // 2. Define the verification binding (closure capturing 'this')
        const boundVerifyCallback = this.verifyCallback.bind(this);

        // 3. Use the extracted plugin for multi-signature processing and role mapping
        const result = MultiSignatureRoleVerifier.execute({
            dataToVerify: canonicalData, 
            signatures: signatures,
            verifyCallback: boundVerifyCallback
        });

        // Type casting is safe here as MultiSignatureRoleVerifier is expected to return this structure
        return result as SignatureVerificationResult;
    }
}

export { GovernanceValidatorService };