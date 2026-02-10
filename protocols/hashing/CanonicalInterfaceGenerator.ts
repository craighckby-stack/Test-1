/**
 * Autonomous Code Evolution & Scaffolding (ACE-S) Utility
 * File: protocols/hashing/CanonicalInterfaceGenerator.ts
 *
 * Generates a canonical, deterministic SHA-256 hash for a provided Interface Definition Language (IDL) or TypeScript Interface string.
 * This utility is required to satisfy the `interfaceHash` mandate in GSR_Contract.json.
 */

// We assume two necessary kernel tools are available globally or injected:
// 1. IDLCanonicalizerUtility (newly extracted)
// 2. IntegrityHashingUtility (existing, assumed global access)

declare const IDLCanonicalizerUtility: {
    execute(args: { definition: string }): string;
};

declare const IntegrityHashingUtility: {
    execute(args: { data: string; algorithm: 'sha256' | 'sha512' }): string;
};

/**
 * Generates the mandatory Interface Hash for GSR registration.
 * This function delegates canonicalization and hashing to specialized kernel plugins.
 * 
 * @param rawInterfaceDefinition - The source code or IDL string.
 * @returns SHA-256 hash string (64 characters).
 */
export function generateInterfaceHash(rawInterfaceDefinition: string): string {
    // Step 1: Canonicalize the definition using the specialized utility
    const canonicalString = IDLCanonicalizerUtility.execute({ 
        definition: rawInterfaceDefinition 
    });
    
    // Step 2: Hash the canonical string using the central hashing utility
    const interfaceHash = IntegrityHashingUtility.execute({
        data: canonicalString,
        algorithm: 'sha256'
    });

    return interfaceHash;
}

/**
 * Example utility for generating the contract configuration checksum itself.
 * @param contractJsonContent - The content to hash.
 * @returns SHA-256 hash string (64 characters).
 */
export function generateContractChecksum(contractJsonContent: string): string {
    // Hash the raw contract JSON content using the central hashing utility.
    return IntegrityHashingUtility.execute({
        data: contractJsonContent,
        algorithm: 'sha256'
    });
}