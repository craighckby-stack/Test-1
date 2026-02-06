import { CryptographicUtil } from './cryptographicUtil.js';

/**
 * Manages access to secrets/configuration data encrypted using the system's Master Encryption Key (MEK).
 * This provider enforces the use of the MEK (expected via environment variables) for centralized security management.
 */
export class SecureConfigProvider {
    
    static #getEncryptionKey() {
        // Define standard key name (e.g., AGI_MEK) and validation
        const key = process.env.AGI_MEK;
        // A 32-byte key is 64 characters in hex
        if (!key || key.length !== 64) {
            throw new Error('FATAL: AGI_MEK environment variable is required and must be a 64 character hex key (32 bytes).');
        }
        return key;
    }

    /**
     * Decrypts a specific encrypted configuration value using the MEK.
     * @param {string} encryptedValue - The encrypted string (IV:Ciphertext:Tag).
     * @returns {string} The decrypted configuration value.
     */
    static getSecret(encryptedValue) {
        const key = SecureConfigProvider.#getEncryptionKey();
        // The decrypted data might itself be JSON if an object was encrypted
        const decrypted = CryptographicUtil.decryptData(encryptedValue, key);
        
        // Try parsing JSON if applicable, otherwise return string
        try {
            return JSON.parse(decrypted);
        } catch (e) {
            return decrypted;
        }
    }

    /**
     * Encrypts a configuration value for persistent storage.
     * NOTE: This is generally used during configuration setup, not routine runtime operations.
     * @param {string|Object} data - The data to encrypt.
     * @returns {string} The encrypted string (IV:Ciphertext:Tag).
     */
    static encryptSecret(data) {
        const key = SecureConfigProvider.#getEncryptionKey();
        return CryptographicUtil.encryptData(data, key);
    }
}