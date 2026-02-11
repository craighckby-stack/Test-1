/**
 * Autonomous Code Evolution & Scaffolding (ACE-S) Utility
 * File: protocols/hashing/CanonicalInterfaceGenerator.ts
 *
 * Provides utilities for generating mandatory GSR interface hashes and contract checksums.
 */

// --- Required Kernel Declarations ---

// Assumed kernel utilities
declare const IntegrityHashingUtility: {
    execute(args: { data: string; algorithm: 'sha256' | 'sha512' }): string;
};

// Newly abstracted plugin for mandatory interface hashing
declare const GSRInterfaceHasher: {
    execute(args: { rawInterfaceDefinition: string }): string;
};

// --- Exported Functions ---

/**
 * Generates the mandatory Interface Hash for GSR registration.
 * Delegates to the specialized GSRInterfaceHasher plugin.
 * 
 * @param rawInterfaceDefinition - The source code or IDL string.
 * @returns SHA-256 hash string (64 characters).
 */
export function generateInterfaceHash(rawInterfaceDefinition: string): string {
    // Logic is now delegated entirely to the abstracted plugin.
    return GSRInterfaceHasher.execute({ rawInterfaceDefinition });
}


/**
 * Example utility for generating the contract configuration checksum itself (SHA-256).
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