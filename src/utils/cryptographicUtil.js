import crypto from 'crypto';

// Constants for AES-256-GCM operations
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Utility for providing standardized cryptographic operations across the AGI architecture.
 * Ensures consistent hashing for integrity checks, immutability validation, and secure handling of secrets.
 */
export class CryptographicUtil {

    /**
     * Helper function to standardize data serialization by recursively sorting object keys.
     * This guarantees deterministic output required for consistent hashing.
     * @param {Object} data - The object to serialize.
     * @returns {string} The deterministically serialized JSON string.
     */
    static #deterministicSerialize(data) {
        if (typeof data === 'undefined' || data === null) {
            return '';
        }
        
        // Use the replacer function to recursively sort object keys to ensure deterministic output
        return JSON.stringify(data, (key, value) => {
            if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
                // Return a new object with sorted keys
                return Object.keys(value).sort().reduce((sorted, k) => {
                    sorted[k] = value[k];
                    return sorted;
                }, {});
            }
            return value;
        });
    }

    /**
     * Generates a deterministic SHA-256 hash of a JavaScript object/payload.
     * Vital for integrity checks and immutability validation.
     * 
     * @param {Object} data - The data object to hash (e.g., proposal payload or config file).
     * @returns {string} The SHA-256 hash in hex format.
     */
    static hashObject(data) {
        const sortedJsonString = CryptographicUtil.#deterministicSerialize(data);
        return crypto.createHash('sha256').update(sortedJsonString, 'utf8').digest('hex');
    }

    /**
     * Generates a strong random token suitable for session IDs, nonces, or salt.
     * @param {number} length - Length of the token in bytes (defaults to 32).
     * @returns {string} Hex encoded random bytes (e.g., 64 hex characters for default 32 bytes).
     */
    static generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Encrypts a payload (string or object) using AES-256-GCM (Authenticated Encryption).
     * Outputs a colon-separated string: IV:EncryptedText:AuthTag.
     * 
     * @param {string|Object} payload - Data to encrypt. If an object, it is serialized.
     * @param {string} encryptionKey - 32-byte (64 hex characters) key in hex format.
     * @returns {string} The encrypted data string.
     * @throws {Error} If key length is invalid.
     */
    static encryptData(payload, encryptionKey) {
        const dataToEncrypt = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
        
        if (encryptionKey.length !== KEY_LENGTH * 2) {
             throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters).`);
        }

        const keyBuffer = Buffer.from(encryptionKey, 'hex');
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

        let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`; // IV:Ciphertext:Tag
    }

    /**
     * Decrypts a payload previously encrypted with AES-256-GCM.
     * @param {string} encryptedData - The colon-separated encrypted string (IV:Ciphertext:Tag).
     * @param {string} encryptionKey - 32-byte (64 hex characters) key in hex format.
     * @returns {string} Decrypted data string.
     * @throws {Error} If decryption fails (e.g., corrupted data, tampering detected, or incorrect key).
     */
    static decryptData(encryptedData, encryptionKey) {
        const parts = encryptedData.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format. Expected IV:Ciphertext:Tag.');
        }

        if (encryptionKey.length !== KEY_LENGTH * 2) {
             throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters).`);
        }

        const [ivHex, encryptedHex, tagHex] = parts;

        const keyBuffer = Buffer.from(encryptionKey, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');

        if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
            throw new Error('Invalid IV or Authentication Tag length.');
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        try {
            decrypted += decipher.final('utf8');
        } catch (e) {
            throw new Error('Authentication failed during decryption. Data may be compromised or key is incorrect.');
        }

        return decrypted;
    }
}