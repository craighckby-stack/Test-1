import crypto from 'crypto';

const ALGORITHM = 'sha256'; // Hashing algorithm for signing
const CURVE = 'prime256v1'; // Standard elliptic curve for security/performance

/**
 * Utility focusing on Asymmetric Cryptography (Digital Signatures).
 * Crucial for proving origin, ensuring non-repudiation, and verifying state integrity
 * across various AGI components (e.g., proposal signing, external communication).
 * Uses Elliptic Curve Digital Signature Algorithm (ECDSA).
 */
export class SignatureUtil {

    // --- Key Management ---

    /**
     * Generates a new ECDSA public/private key pair suitable for digital signing.
     * @returns {{publicKey: string, privateKey: string}}
     */
    static async generateKeyPair() {
        return new Promise((resolve, reject) => {
            crypto.generateKeyPair('ec', {
                namedCurve: CURVE,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            }, (err, publicKey, privateKey) => {
                if (err) return reject(new Error(`Failed to generate EC key pair: ${err.message}`));
                resolve({ publicKey, privateKey });
            });
        });
    }

    // --- Signing and Verification ---

    /**
     * Generates a digital signature for a data payload using a private key.
     * Data should typically be pre-hashed or deterministically serialized before passing here.
     * @param {string|Buffer} data - The data (or hash of data) to sign.
     * @param {string} privateKeyPem - The private key in PEM format.
     * @returns {string} The digital signature in base64 format.
     */
    static sign(data, privateKeyPem) {
        const signer = crypto.createSign(ALGORITHM);
        signer.update(data);
        return signer.sign(privateKeyPem, 'base64');
    }

    /**
     * Verifies a digital signature against the original data using a public key.
     * @param {string|Buffer} data - The original data (or hash of data).
     * @param {string} signatureBase64 - The digital signature in base64 format.
     * @param {string} publicKeyPem - The public key in PEM format.
     * @returns {boolean} True if the signature is valid, false otherwise.
     */
    static verify(data, signatureBase64, publicKeyPem) {
        const verifier = crypto.createVerify(ALGORITHM);
        verifier.update(data);
        return verifier.verify(publicKeyPem, signatureBase64, 'base64');
    }
}