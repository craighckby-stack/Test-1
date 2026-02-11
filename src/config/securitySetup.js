import { KEY_LENGTH } from '../utils/cryptographicUtil.js';
import { ConfigurationError } from '../errors/ConfigurationError.js';
import { validateCryptographicKey } from '../tools/CryptographicKeyValidatorTool.js';
import { ConfigurationInitializer } from '../utils/ConfigurationInitializer.js';

// Configuration constants
const REQUIRED_KEY_HEX_LENGTH = KEY_LENGTH * 2;
const MASTER_KEY_ENV_VAR = 'AGI_MASTER_KEY';
const CONFIGURATION_NAME = 'AGI Master Key configuration';

/**
 * Retrieves and validates the AES Master Key (AGI_MASTER_KEY) from environment variables.
 * @returns {string} The validated master key.
 * @throws {ConfigurationError} If the key is missing or invalid.
 */
export function getMasterEncryptionKey(): string {
    const key = process.env[MASTER_KEY_ENV_VAR];

    // Use the reusable validation tool
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
    ConfigurationInitializer.initialize(
        CONFIGURATION_NAME,
        getMasterEncryptionKey,
        ConfigurationError
    );
}