// The refactored ADM mandates the use of cryptographic hashes (`sourceHash`) for all content. 
// This utility resolves a given hash to its binary content, retrieved from a secure, immutable internal artifact store. 
// This service must enforce access controls and confirm artifact integrity on retrieval.

/**
 * Interface representing the required utility functions.
 * Assumed available through the AGI-KERNEL environment.
 */
declare const IntegrityHashingUtility: {
    validateHashFormat: (hash: string, algorithm: string) => boolean;
    computeContentHash: (content: any, algorithm: string) => string;
};

/**
 * @class CryptographicArtifactResolver
 * Manages secure retrieval of deployment artifacts based on cryptographic identity.
 */
class CryptographicArtifactResolver {
    constructor(secureStorageClient) {
        this.client = secureStorageClient;
    }

    /**
     * Resolves a hash identifier to its corresponding binary content.
     * @param {string} sha256Hash - The SHA-256 hash provided in the ADM instruction.
     * @returns {Promise<Buffer>} The validated binary content of the artifact.
     */
    async resolve(sha256Hash) {
        
        // 1. Hash Format Validation using Utility
        if (!IntegrityHashingUtility.validateHashFormat(sha256Hash, 'sha256')) {
            throw new Error("Invalid hash format provided.");
        }

        const artifact = await this.client.getArtifact(sha256Hash);

        // 2. Critical Security Check: Validate content integrity immediately after retrieval
        // Note: computeContentHash must handle Buffer/binary types provided by artifact.content
        const computedHash = IntegrityHashingUtility.computeContentHash(artifact.content, 'sha256');
        
        if (computedHash !== sha256Hash) {
            throw new Error(`Integrity mismatch for artifact ${sha256Hash}. Computed hash differs.`);
        }

        return artifact.content;
    }
}

module.exports = CryptographicArtifactResolver;