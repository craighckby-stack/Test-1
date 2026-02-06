import crypto from 'crypto';
import util from 'util';

// Use built-in promisification for cleaner async handling
const generateKeyPairAsync = util.promisify(crypto.generateKeyPair);

const ALGORITHM = 'sha256';
const CURVE = 'prime256v1'; // ECDSA standard curve (P-256)

/**
 * Ensures consistent serialization of data for signing purposes (Canonical JSON subset).
 * Handles primitives, Buffer, and deterministically serializes objects/arrays.
 * @param {any} data
 * @returns {Buffer}
 */
function serialize(data) {
    if (data instanceof Buffer) {
        return data;
    }
    if (typeof data === 'string') {
        return Buffer.from(data, 'utf8');
    }

    // Handle complex types (objects/arrays) via deterministic stringification.
    if (typeof data === 'object' && data !== null) {
        // Uses a replacer to ensure keys are sorted for deterministic output.
        const str = JSON.stringify(data, (key, value) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Create a new object with sorted keys recursively
                return Object.keys(value).sort().reduce((sorted, k) => {
                    sorted[k] = value[k];
                    return sorted;
                }, {});
            }
            return value;
        });
        return Buffer.from(str, 'utf8');
    }

    return Buffer.from(String(data), 'utf8');
}

/**
 * Utility focusing on Asymmetric Cryptography (Digital Signatures - ECDSA).
 * Crucial for proving origin, non-repudiation, and verifying state integrity.
 * All signing/verification operations automatically use deterministic data serialization.
 */
export class SignatureUtil {

    // --- Key Management ---

    /**
     * Generates a new ECDSA public/private key pair suitable for digital signing.
     * @returns {Promise<{publicKey: string, privateKey: string}>}
     */
    static async generateKeyPair() {
        const { publicKey, privateKey } = await generateKeyPairAsync('ec', {
            namedCurve: CURVE,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        return { publicKey, privateKey };
    }

    /**
     * Converts data into its canonical serialized Buffer representation prior to hashing/signing.
     * @param {any} data - Data payload (string, buffer, or object).
     * @returns {Buffer} The serialized buffer.
     */
    static serializeForSigning(data) {
        return serialize(data);
    }

    // --- Signing and Verification ---

    /**
     * Generates a digital signature for a data payload using a private key.
     * Data is deterministically serialized internally before signing.
     * @param {any} data - The data payload to sign.
     * @param {string} privateKeyPem - The private key in PEM format.
     * @returns {string} The digital signature (Base64 DER encoding).
     */
    static sign(data, privateKeyPem) {
        const bufferToSign = SignatureUtil.serializeForSigning(data);
        const signer = crypto.createSign(ALGORITHM);
        signer.update(bufferToSign);
        return signer.sign(privateKeyPem, 'base64');
    }

    /**
     * Verifies a digital signature against the original data using a public key.
     * Data is deterministically serialized internally before verification.
     * @param {any} data - The original data payload.
     * @param {string} signatureBase64 - The digital signature in base64 format.
     * @param {string} publicKeyPem - The public key in PEM format.
     * @returns {boolean} True if the signature is valid, false otherwise.
     */
    static verify(data, signatureBase64, publicKeyPem) {
        const bufferToVerify = SignatureUtil.serializeForSigning(data);
        const verifier = crypto.createVerify(ALGORITHM);
        verifier.update(bufferToVerify);
        return verifier.verify(publicKeyPem, signatureBase64, 'base64');
    }

    // --- Data Integrity Helpers ---
    
    /**
     * Calculates the hash of deterministically serialized data.
     * Useful for content addressing or checking integrity of large messages.
     * @param {any} data 
     * @returns {string} Hex encoded hash.
     */
    static hash(data) {
        const buffer = SignatureUtil.serializeForSigning(data);
        return crypto.createHash(ALGORITHM).update(buffer).digest('hex');
    }
}