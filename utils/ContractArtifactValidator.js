/**
 * ContractArtifactValidator
 * Ensures consistency and integrity of loaded smart contract JSON artifacts (ABI, bytecode, metadata).
 * This utility enhances system stability by preventing runtime failures caused by partial or corrupted build files.
 */

class ContractArtifactValidator {
    /**
     * Validates the structure and necessary components of a raw contract artifact JSON object.
     * @param {object} rawArtifact - The JSON content loaded from a contract artifact file.
     * @returns {object} The validated artifact object.
     * @throws {Error} if the artifact is invalid or missing critical fields.
     */
    static validate(rawArtifact) {
        if (!rawArtifact || typeof rawArtifact !== 'object') {
            throw new Error('Artifact must be a non-null object.');
        }

        const requiredKeys = ['contractName', 'abi', 'bytecode'];
        for (const key of requiredKeys) {
            if (!(key in rawArtifact)) {
                throw new Error(`Artifact missing required key: ${key}. Artifact name: ${rawArtifact.contractName || 'Unknown'}`);
            }
        }

        if (typeof rawArtifact.contractName !== 'string' || rawArtifact.contractName.trim() === '') {
            throw new Error('Contract name must be a non-empty string.');
        }

        if (!Array.isArray(rawArtifact.abi)) {
            throw new Error(`ABI for ${rawArtifact.contractName} must be an array.`);
        }

        // Bytecode must be a hex string prefixed with 0x (or empty 0x if unlinked/abstract)
        if (typeof rawArtifact.bytecode !== 'string' || !rawArtifact.bytecode.startsWith('0x')) {
            throw new Error(`Bytecode for ${rawArtifact.contractName} must be a hex string starting with 0x.`);
        }

        // Additional optional checks (e.g., metadata existence, compiler version check)

        return rawArtifact;
    }

    /**
     * Wrapper to load and validate a contract artifact from a given path (Implementation detail pending context).
     * @param {string} artifactPath
     */
    static async loadAndValidate(artifactPath) {
        // Placeholder implementation: Needs actual file reading utility.
        // const rawData = await fs.readFile(artifactPath);
        // const artifact = JSON.parse(rawData);
        // return ContractArtifactValidator.validate(artifact);
        throw new Error('loadAndValidate method requires environment-specific file system access implementation.');
    }
}

module.exports = ContractArtifactValidator;
