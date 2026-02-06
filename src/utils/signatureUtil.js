import crypto from 'crypto';
import util from 'util';

const generateKeyPairAsync = util.promisify(crypto.generateKeyPair);

// Standard cryptographic constants for signing
// NOTE: These should be configured centrally in a larger system (see architectural proposal)
const ALGORITHM = 'sha256';
const CURVE = 'prime256v1'; // ECDSA standard curve (P-256)

/**
 * Recursively sorts object keys alphabetically to ensure deterministic serialization.
 * Only modifies objects; returns other types as is.
 * @param {any} data
 * @returns {any} A structure identical to data, but with sorted object keys.
 */
function _sortData(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    if (Array.isArray(data)) {
        // Arrays maintain order but nested objects within are sorted
        return data.map(item => _sortData(item));
    }

    // Handle plain objects: sort keys and map values recursively
    const sortedKeys = Object.keys(data).sort();
    
    return sortedKeys.reduce((sortedObject, key) => {
        sortedObject[key] = _sortData(data[key]);
        return sortedObject;
    }, {});
}

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

    // Step 1: Recursively sort complex objects to ensure key ordering consistency.
    if (typeof data === 'object' && data !== null) {
        const sortedData = _sortData(data);
        // Step 2: Stringify the now deterministically ordered structure.
        const str = JSON.stringify(sortedData);
        return Buffer.from(str, 'utf8');
    }

    // Handle primitives (number, boolean, etc.)
    return Buffer.from(String(data), 'utf8');
}


/**
 * Utility focusing on Asymmetric Cryptography (Digital Signatures - ECDSA).
 * Crucial for proving origin, non-repudiation, and verifying state integrity.
 * All signing/verification operations automatically use deterministic data serialization.
 */
export class SignatureUtil {

    // --- Internal Helpers ---
    
    /**
     * Converts data into its canonical serialized Buffer representation prior to hashing/signing.
     * @param {any} data - Data payload (string, buffer, or object).
     * @returns {Buffer} The serialized buffer.
     */
    static serializeForSigning(data) {
        // Exposes the core serialization mechanism used for signing/verification checks.
        return serialize(data);
    }

    // --- Key Management ---

    /**
     * Generates a new ECDSA public/private key pair suitable for digital signing.
     * Uses P-256 curve and PEM encoding (PKCS#8 for private, SPKI for public).
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

    // --- Signing and Verification ---

    /**
     * Generates a digital signature for a data payload using a private key.
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
     * @param {any} data 
     * @returns {string} Hex encoded hash (content address).
     */
    static hash(data) {
        const buffer = SignatureUtil.serializeForSigning(data);
        return crypto.createHash(ALGORITHM).update(buffer).digest('hex');
    }
}