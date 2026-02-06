import { KEY_LENGTH } from '../utils/cryptographicUtil.js';

const REQUIRED_KEY_HEX_LENGTH = KEY_LENGTH * 2; 

/**
 * Validates and retrieves core cryptographic keys from the environment variables.
 * Ensures operational keys are present and conform to required lengths (e.g., AES-256).
 */
export class SecuritySetup {
    
    /**
     * Retrieves and validates the AES Master Key (AGI_MASTER_KEY) from environment variables.
     * @returns {string} The validated 64-character hex master key.
     * @throws {Error} If the key is missing or invalid.
     */
    static getMasterEncryptionKey() {
        const key = process.env.AGI_MASTER_KEY;
        
        if (!key) {
            throw new Error("SECURITY CONFIG ERROR: AGI_MASTER_KEY environment variable is missing. Encryption/Decryption cannot proceed.");
        }

        if (typeof key !== 'string' || key.length !== REQUIRED_KEY_HEX_LENGTH) {
            throw new Error(`SECURITY CONFIG ERROR: AGI_MASTER_KEY must be a ${REQUIRED_KEY_HEX_LENGTH}-character hex string (${KEY_LENGTH} bytes). Current length: ${key.length}.`);
        }
        
        if (!/^[0-9a-fA-F]+$/.test(key)) {
             throw new Error("SECURITY CONFIG ERROR: AGI_MASTER_KEY contains non-hexadecimal characters.");
        }

        return key;
    }

    /**
     * Executes essential cryptographic environment checks on system startup.
     * This ensures the AGI fails fast if core secrets management prerequisites are not met.
     */
    static initializeChecks() {
        console.log("SecuritySetup: Validating AGI Master Key configuration...");
        try {
            SecuritySetup.getMasterEncryptionKey();
            console.log("SecuritySetup: Master Encryption Key validated successfully.");
        } catch (error) {
            // Propagate the error during system initialization to halt deployment.
            throw error;
        }
    }
}