const crypto = require('crypto');

// Define the assumed interface for the external Canonicalization Tool
interface CanonicalizerTool {
    generate(data: unknown): string;
}

// NOTE: We assume the AGI kernel environment exposes the defined plugin
// 'CanonicalPayloadGenerator' logic through a known access mechanism (e.g., global utility map).
const CanonicalizerUtility: CanonicalizerTool = (global as any).CanonicalPayloadGenerator || {
    generate: (data: unknown) => {
        // Fallback/Error: The utility must be initialized by the kernel
        throw new Error("CanonicalPayloadGenerator utility not initialized or available.");
    }
};

/**
 * Utility for ensuring deterministic state serialization and secure hashing.
 * Essential for cryptographic integrity checks across distributed sovereign nodes.
 * Ensures that complex objects yield the exact same hash across all nodes.
 */
class Canonicalizer {

    /**
     * Converts a complex object into a deterministically ordered JSON string 
     * suitable for hashing/signing, utilizing the specialized CanonicalPayloadGenerator tool.
     * 
     * @param {unknown} data 
     * @returns {string} Canonical JSON string.
     */
    static canonicalize(data: unknown): string {
        return CanonicalizerUtility.generate(data);
    }

    /**
     * Calculates a secure cryptographic hash of the canonical data.
     * NOTE: Algorithm choice should be standardized via ConsensusConfig.
     * @param {string} canonicalData - Data obtained from canonicalize().
     * @param {string} algorithm - Hashing algorithm (Default: SHA-256).
     * @returns {string} Hexadecimal hash digest.
     */
    static hash(canonicalData: string, algorithm: string = 'sha256'): string {
        if (typeof canonicalData !== 'string') {
             throw new Error("Input to hash must be a canonical string.");
        }
        return crypto
            .createHash(algorithm.toLowerCase())
            .update(canonicalData, 'utf8')
            .digest('hex');
    }
}

module.exports = Canonicalizer;