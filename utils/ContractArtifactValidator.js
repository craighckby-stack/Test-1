/**
 * ContractArtifactValidator
 * Ensures consistency and integrity of loaded smart contract JSON artifacts (ABI, bytecode, metadata).
 * This utility enhances system stability by preventing runtime failures caused by partial or corrupted build files.
 */

const { InvalidArtifactError } = require('./errors/InvalidArtifactError');

class ContractArtifactValidator {
    // Define mandatory structure and constant values explicitly for clarity and maintainability.
    static MANDATORY_KEYS = ['contractName', 'abi', 'bytecode'];
    static HEX_PREFIX = '0x';

    /**
     * Internal helper to validate basic object structure and key presence.
     * @param {object} artifact - The JSON content loaded.
     */
    static _validateStructure(artifact) {
        if (!artifact || typeof artifact !== 'object') {
            throw new InvalidArtifactError('Artifact must be a non-null object.');
        }

        const missingKeys = ContractArtifactValidator.MANDATORY_KEYS.filter(
            key => !(key in artifact)
        );

        if (missingKeys.length > 0) {
            const contractName = artifact.contractName || 'Unknown';
            throw new InvalidArtifactError(
                `Artifact for '${contractName}' is missing required keys: ${missingKeys.join(', ')}.`
            );
        }
    }

    /**
     * Validates the structure and necessary components of a raw contract artifact JSON object.
     * @param {object} rawArtifact - The JSON content loaded from a contract artifact file.
     * @returns {object} The validated artifact object.
     * @throws {InvalidArtifactError} if the artifact is invalid or missing critical fields.
     */
    static validate(rawArtifact) {
        // 1. Structural Check
        ContractArtifactValidator._validateStructure(rawArtifact);

        const name = rawArtifact.contractName;

        // 2. Type & Format Checks
        if (typeof name !== 'string' || name.trim() === '') {
            throw new InvalidArtifactError('Contract name must be a non-empty string.', { field: 'contractName' });
        }

        if (!Array.isArray(rawArtifact.abi)) {
            throw new InvalidArtifactError(`ABI for ${name} must be an array.`, { field: 'abi' });
        }

        // 3. Bytecode Checks
        const bytecode = rawArtifact.bytecode;
        if (typeof bytecode !== 'string' || !bytecode.startsWith(ContractArtifactValidator.HEX_PREFIX)) {
            throw new InvalidArtifactError(
                `Bytecode for ${name} must be a hex string starting with ${ContractArtifactValidator.HEX_PREFIX}.`,
                { field: 'bytecode' }
            );
        }

        // 4. Optional checks (improved logging for missing non-critical but highly recommended fields)
        if (rawArtifact.deployedBytecode && typeof rawArtifact.deployedBytecode !== 'string') {
            console.warn(`[Validator] Deployed bytecode format invalid for ${name}. Expected string.`);
        }

        if (!rawArtifact.metadata) {
             // Metadata is essential for linking and compilation tracking in advanced toolchains.
             console.warn(`[Validator] Artifact for ${name} is missing 'metadata'.`);
        }

        return rawArtifact;
    }

    /**
     * Wrapper to load and validate a contract artifact from a given path.
     * Implementation remains a placeholder until file system abstraction is implemented or injected.
     * @param {string} artifactPath
     */
    static async loadAndValidate(artifactPath) {
        throw new InvalidArtifactError(
            `loadAndValidate requires an injected FileSystem utility. Path: ${artifactPath}.`
        );
    }
}

module.exports = ContractArtifactValidator;
