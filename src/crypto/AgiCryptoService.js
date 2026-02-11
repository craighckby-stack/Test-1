/**
 * AGS: AGI CRYPTO SERVICE (V95.3)
 * Scope: Stage 1/Security Core Utility.
 * Function: Provides standardized, high-assurance cryptographic primitives required
 * by the System State Verifier (SSV), Governance Rule System (GRS), and other sensitive components.
 *
 * NOTE: All cryptographic operations are now delegated to the CanonicalCryptoUtility plugin
 * to ensure platform abstraction, integrity, and compliance.
 */

/**
 * @typedef {object} ICanonicalCryptoUtility
 * @property {(data: string, algorithm: string) => string} calculateHash - Calculates a hash digest.
 * @property {(data: string, signature: string, attestationKeyId: string) => boolean} verifySignature - Verifies a signature.
 */

class AgiCryptoService {
    // Constants are typed using JSDoc standard or retained if TS is implicitly handled by the environment.
    private readonly ALGORITHM_HASH = 'sha256';
    private readonly ALGORITHM_SIGNATURE = 'ecdsa';
    /** @type {ICanonicalCryptoUtility} */
    private readonly cryptoUtility;

    /**
     * @param {ICanonicalCryptoUtility} cryptoUtility - Injected utility for crypto operations.
     */
    constructor(cryptoUtility) {
        // CRITICAL: Ensure the utility is available and implements the required method.
        if (!cryptoUtility || typeof cryptoUtility.calculateHash !== 'function') {
            throw new Error("AgiCryptoService requires a valid ICanonicalCryptoUtility instance providing calculateHash.");
        }
        this.cryptoUtility = cryptoUtility;
    }

    /**
     * Calculates a cryptographic hash of the input data.
     * Delegates implementation to CanonicalCryptoUtility.
     * @param {string} data - The input data string.
     * @param {string} [algorithm] - Hashing algorithm (e.g., 'sha256'). Defaults to internal standard.
     * @returns {string} The computed hash digest (hexadecimal).
     */
    public hash(data, algorithm = this.ALGORITHM_HASH) {
        return this.cryptoUtility.calculateHash(data, algorithm);
    }

    /**
     * Verifies an external cryptographic signature against the data and a known public key.
     * Delegates implementation to CanonicalCryptoUtility.
     * @param {string} data - The original data payload.
     * @param {string} signature - The signature to verify.
     * @param {string} attestationKeyId - Identifier for the public key used for verification.
     * @returns {boolean} True if the signature is valid, false otherwise.
     */
    public verifySignature(data, signature, attestationKeyId) {
        return this.cryptoUtility.verifySignature(data, signature, attestationKeyId);
    }
}

module.exports = AgiCryptoService;