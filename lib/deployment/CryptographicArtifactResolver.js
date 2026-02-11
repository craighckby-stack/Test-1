/**
 * @class CryptographicArtifactResolver
 * Manages secure retrieval of deployment artifacts based on cryptographic identity.
 */
class CryptographicArtifactResolver {
    /**
     * @param {object} secureStorageClient - Client for retrieving artifacts (must have getArtifact).
     * @param {object} integrityVerifier - Instance of IntegrityVerificationService plugin.
     */
    constructor(secureStorageClient, integrityVerifier) {
        if (!integrityVerifier || typeof integrityVerifier.verifyArtifactIntegrity !== 'function') {
            throw new Error("CryptographicArtifactResolver requires a valid IntegrityVerificationService instance.");
        }
        this.client = secureStorageClient;
        this.integrityVerifier = integrityVerifier;
    }

    /**
     * Resolves a hash identifier to its corresponding binary content.
     * @param {string} sha256Hash - The SHA-256 hash provided in the ADM instruction.
     * @returns {Promise<Buffer>} The validated binary content of the artifact.
     */
    async resolve(sha256Hash) {
        
        const artifact = await this.client.getArtifact(sha256Hash);

        // Utilize the abstracted service for critical integrity validation
        // This enforces format checking and content hashing/comparison in one step.
        this.integrityVerifier.verifyArtifactIntegrity(sha256Hash, artifact.content, 'sha256');

        return artifact.content;
    }
}

module.exports = CryptographicArtifactResolver;