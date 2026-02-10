import { KEY_LENGTH } from '../utils/cryptographicUtil.js';
import { ConfigurationError } from '../errors/ConfigurationError.js';
import { validateCryptographicKey } from '../tools/CryptographicKeyValidatorTool.js'; // New utility derived from plugin

// Configuration constants
const REQUIRED_KEY_HEX_LENGTH = KEY_LENGTH * 2;
const MASTER_KEY_ENV_VAR = 'AGI_MASTER_KEY';

/**
 * Retrieves and validates the AES Master Key (AGI_MASTER_KEY) from environment variables.
 * @returns {string} The validated master key.
 * @throws {ConfigurationError} If the key is missing or invalid.
 */
export function getMasterEncryptionKey(): string {
    const key = process.env[MASTER_KEY_ENV_VAR];

    // Use the reusable validation tool (extracted plugin logic)
    validateCryptographicKey({
        keyName: MASTER_KEY_ENV_VAR,
        key: key,
        requiredLength: REQUIRED_KEY_HEX_LENGTH,
        // Pass the ConfigurationError class so the tool throws the correct domain-specific error.
        ErrorClass: ConfigurationError,
    });

    return key;
}

/**
 * Executes essential cryptographic environment checks on system startup.
 * This ensures the AGI fails fast if core secrets management prerequisites are not met.
 * @throws {ConfigurationError} If validation fails.
 */
export function initializeSecurityChecks(): void {
    console.log("Security Setup: Validating AGI Master Key configuration...");
    try {
        getMasterEncryptionKey();
        console.log("Security Setup: Master Encryption Key validated successfully.");
    } catch (error) {
        // Ensure configuration errors propagate correctly during initialization
        if (error instanceof ConfigurationError) {
            throw error;
        }
        throw new ConfigurationError("Security initialization failed unexpectedly.", { originalError: error });
    }
}