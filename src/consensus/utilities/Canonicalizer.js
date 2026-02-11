/**
 * NOTE: We rely on the kernel injecting the required utilities.
 */

// Interface for the deterministic serialization tool
interface CanonicalizerTool {
    generate(data: unknown): string;
}

// Interface for the general cryptographic hashing tool
interface SecureHasherTool {
    hash(data: string, algorithm?: string): string;
}

// Access the kernel-provided Canonicalization Utility
const CanonicalizerUtility: CanonicalizerTool = (global as any).CanonicalPayloadGenerator || {
    generate: (data: unknown) => {
        // Fallback/Error: The utility must be initialized by the kernel
        throw new Error("CanonicalPayloadGenerator utility not initialized or available.");
    }
};

// Access the kernel-provided Hashing Utility (SecureHasher plugin)
const HasherUtility: SecureHasherTool = (global as any).SecureHasher || {
    hash: (data: string, algorithm?: string) => {
        // Fallback/Error: The utility must be initialized by the kernel
        throw new Error("SecureHasher utility not initialized or available.");
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
     * Calculates a secure cryptographic hash of the canonical data using the SecureHasher utility.
     * NOTE: Algorithm choice should be standardized via ConsensusConfig.
     * 
     * @param {string} canonicalData - Data obtained from canonicalize().
     * @param {string} algorithm - Hashing algorithm (Default: SHA-256).
     * @returns {string} Hexadecimal hash digest.
     */
    static hash(canonicalData: string, algorithm: string = 'sha256'): string {
        if (typeof canonicalData !== 'string') {
             throw new Error("Input to hash must be a canonical string.");
        }
        // Delegate hashing logic to the dedicated plugin
        return HasherUtility.hash(canonicalData, algorithm);
    }
}

module.exports = Canonicalizer;
