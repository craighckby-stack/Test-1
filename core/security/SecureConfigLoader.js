/**
 * core/security/SecureConfigLoader.js
 *
 * Component responsible for securely loading and verifying critical system
 * configuration files, ensuring integrity and immutability during runtime.
 */

import * as fs from 'fs/promises'; // Changed to use promises for async I/O
import * as path from 'path';
import * as crypto from 'crypto';
import { SystemLogger } from '../system/SystemLogger';

const LOADER_SOURCE = 'SECURE_CONFIG_LOADER';
const logger = new SystemLogger(LOADER_SOURCE);

/**
 * Custom Error Types for structured failure handling.
 * Improves observability and resilience in core systems.
 */
class ConfigReadError extends Error {
    constructor(message, filePath) {
        super(`[ConfigReadError] HALT: ${message} File: ${path.basename(filePath)}`);
        this.name = 'ConfigReadError';
        this.filePath = filePath;
    }
}

class ConfigIntegrityError extends Error {
    constructor(message, filePath) {
        super(`[ConfigIntegrityError] HALT: ${message} File: ${path.basename(filePath)}`);
        this.name = 'ConfigIntegrityError';
        this.filePath = filePath;
    }
}

class ConfigParseError extends Error {
    constructor(message, filePath) {
        super(`[ConfigParseError] HALT: ${message} File: ${path.basename(filePath)}`);
        this.name = 'ConfigParseError';
        this.filePath = filePath;
    }
}

export class SecureConfigLoader {

    /**
     * Loads a critical configuration file and performs a simple hash integrity check asynchronously.
     *
     * @param {string} filePath - Absolute path to the configuration file (e.g., JSON).
     * @param {string | null} [expectedHash=null] - Optional SHA256 hash to verify file integrity.
     * @returns {Promise<object>} Parsed configuration object.
     * @throws {ConfigReadError | ConfigIntegrityError | ConfigParseError}
     */
    static async load(filePath, expectedHash = null) {
        logger.info(`Attempting to securely load config: ${filePath}`);

        let fileContent;
        try {
            // Use async read to prevent blocking the kernel's execution loop.
            fileContent = await fs.readFile(filePath, 'utf8');
        } catch (error) {
            logger.critical(`SECURITY FAILURE: Cannot read critical config file at ${filePath}.`, { error: error.message });
            // Immediate halt required if a critical config file cannot be accessed.
            throw new ConfigReadError(`File read failure`, filePath);
        }

        const currentHash = crypto.createHash('sha256').update(fileContent).digest('hex');

        if (expectedHash && currentHash !== expectedHash) {
            logger.critical(`SECURITY BREACH DETECTED: Config integrity failure for ${path.basename(filePath)}.`, {
                expected: expectedHash,
                current: currentHash
            });
            // Immediate halt required if config integrity is compromised.
            throw new ConfigIntegrityError(`Integrity check failed`, filePath);
        }

        try {
            // Attempt to parse JSON content
            return JSON.parse(fileContent);
        } catch (error) {
            logger.critical(`CONFIGURATION ERROR: Failed to parse JSON content in ${filePath}.`, { error: error.message });
            throw new ConfigParseError(`JSON parsing failed`, filePath);
        }
    }

    /**
     * Calculates the hash of a given file content string.
     * @param {string} content - The content to hash.
     * @returns {string} SHA256 hash string.
     */
    static getHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}