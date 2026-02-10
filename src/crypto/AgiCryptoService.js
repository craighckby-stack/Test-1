/**
 * AGS: AGI CRYPTO SERVICE (V95.3)
 * Scope: Stage 1/Security Core Utility.
 * Function: Provides standardized, high-assurance cryptographic primitives required
 * by the System State Verifier (SSV), Governance Rule System (GRS), and other sensitive components.
 *
 * NOTE: All cryptographic operations are now delegated to the CanonicalCryptoUtility plugin
 * to ensure platform abstraction, integrity, and compliance.
 */

// Define the interface that the external utility must satisfy (for TypeScript context)
interface ICanonicalCryptoUtility {
    calculateHash(data: string, algorithm: string): string;
    verifySignature(data: string, signature: string, attestationKeyId: string): boolean;
}

// Assuming the Kernel provides a mechanism to retrieve the required utility.
// For standard DI, we pass it in the constructor.

class AgiCryptoService {
    private readonly ALGORITHM_HASH: string = 'sha256';
    private readonly ALGORITHM_SIGNATURE: string = 'ecdsa';
    private readonly cryptoUtility: ICanonicalCryptoUtility;

    /**
     * @param {ICanonicalCryptoUtility} cryptoUtility - Injected utility for crypto operations.
     */
    constructor(cryptoUtility: ICanonicalCryptoUtility) {
        // CRITICAL: Ensure the utility is available. In a real system, this would enforce initialization.
        if (!cryptoUtility || typeof cryptoUtility.calculateHash !== 'function') {
            throw new Error("AgiCryptoService requires a valid CanonicalCryptoUtility instance.");
        }
        this.cryptoUtility = cryptoUtility;
    }

    /**
     * Calculates a cryptographic hash of the input data.
     * Delegates implementation to CanonicalCryptoUtility.
     * @param {string} data - The input data string.
     * @param {string} algorithm - Hashing algorithm (e.g., 'sha256').
     * @returns {string} The computed hash digest (hexadecimal).
     */
    public hash(data: string, algorithm: string = this.ALGORITHM_HASH): string {
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
    public verifySignature(data: string, signature: string, attestationKeyId: string): boolean {
        return this.cryptoUtility.verifySignature(data, signature, attestationKeyId);
    }
}

module.exports = AgiCryptoService;