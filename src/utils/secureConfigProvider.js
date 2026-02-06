import { CryptographicUtil } from './cryptographicUtil.js';

/**
 * Manages access to secrets/configuration data encrypted using the system's Master Encryption Key (MEK).
 * This provider enforces the use of the MEK (expected via environment variables) for centralized security management.
 * The MEK is retrieved and validated only once upon the first access, improving performance during runtime.
 */
export class SecureConfigProvider {

    /**
     * @type {string | null} Cached Master Encryption Key (AGI_MEK).
     */
    static #masterEncryptionKey = null;
    
    /**
     * Retrieves and validates the MEK from environment variables, caching it on first access.
     * @returns {string} The validated 32-byte (64 char hex) encryption key.
     * @private
     */
    static #getEncryptionKey() {
        if (SecureConfigProvider.#masterEncryptionKey) {
            return SecureConfigProvider.#masterEncryptionKey;
        }

        // Define standard key name (e.g., AGI_MEK) and validation
        const key = process.env.AGI_MEK;
        
        // A 32-byte key is required to be 64 characters in hex format
        if (!key || key.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(key)) {
            throw new Error(
                'FATAL: AGI_MEK environment variable is required and must be a 64 character hexadecimal key (32 bytes).'
            );
        }
        
        // Cache the validated key
        SecureConfigProvider.#masterEncryptionKey = key;
        return key;
    }

    /**
     * Decrypts a specific encrypted configuration value using the MEK.
     * @param {string} encryptedValue - The encrypted string (IV:Ciphertext:Tag).
     * @returns {any} The decrypted configuration value (parsed as JSON if possible, otherwise string).
     */
    static getSecret(encryptedValue) {
        if (typeof encryptedValue !== 'string' || encryptedValue.trim() === '') {
            // Prevent attempting to decrypt null/undefined/empty inputs
            return encryptedValue; 
        }
        
        const key = SecureConfigProvider.#getEncryptionKey();
        
        try {
            const decrypted = CryptographicUtil.decryptData(encryptedValue, key);
            
            // Attempt parsing JSON if the resulting data looks like serialized structure
            try {
                return JSON.parse(decrypted);
            } catch (e) {
                return decrypted;
            }
        } catch (error) {
            // General catch for failed decryption (e.g., bad format, wrong key/tag)
            throw new Error(`Configuration Decryption Failed: The secret may be corrupted or encrypted with an incorrect MEK. Details: ${error.message}`);
        }
    }

    /**
     * Encrypts a configuration value for persistent storage.
     * @param {string|Object} data - The data to encrypt. If an object, it is serialized to JSON first.
     * @returns {string} The encrypted string (IV:Ciphertext:Tag).
     */
    static encryptSecret(data) {
        const key = SecureConfigProvider.#getEncryptionKey();
        
        // Ensure data is consistently stringified if it's an object/non-string
        const dataToEncrypt = typeof data === 'object' && data !== null
            ? JSON.stringify(data)
            : String(data);

        return CryptographicUtil.encryptData(dataToEncrypt, key);
    }
}