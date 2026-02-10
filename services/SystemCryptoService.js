/**
 * SystemCryptoService v1.0.0 (Sovereign AGI)
 * Provides secure cryptographic hashing utilities for verifying system component integrity.
 * This service is critical for auditing configuration manifest (SPDM) integrity.
 */

// AGI Kernel Plugin Reference (Conceptual/Injected Dependency)
// We assume this reference points to the extracted IntegrityHashingUtility plugin logic
const I_HASH_UTIL = globalThis.__KERNEL_PLUGINS?.IntegrityHashingUtility || {
    // Provide a safe stub for TypeScript compilation and runtime safety if the plugin is missing
    execute: ({ method, data, algorithm, expectedHash }: any) => {
        throw new Error(`IntegrityHashingUtility is not loaded. Cannot perform ${method}.`);
    }
};

class SystemCryptoService {

    /**
     * Generates a cryptographic hash for data integrity verification.
     * @param {string | Buffer} data - The input data to hash (e.g., stringified JSON).
     * @param {'sha256' | 'sha3-512' | 'sha384'} algorithm - The hashing algorithm to use.
     * @returns {string} The hash digest in hexadecimal format (prefixed with 0x).
     */
    static hash(data: string | Buffer, algorithm: 'sha256' | 'sha3-512' | 'sha384' = 'sha3-512'): string {
        try {
            return I_HASH_UTIL.execute({
                method: 'hash',
                data: data,
                algorithm: algorithm
            }) as string;
        } catch (error: any) {
            // Wrap utility errors in service-specific security failure messages.
            console.error("SystemCryptoService failure during hashing:", error.message);
            throw new Error(`CRITICAL SECURITY FAILURE: Could not generate integrity hash using ${algorithm}.`);
        }
    }

    /**
     * Verifies data integrity against a provided expected hash.
     * @param {string | Buffer} data - The data to check.
     * @param {string} expectedHash - The hash the data must match.
     * @param {'sha256' | 'sha3-512' | 'sha384'} algorithm - The hashing algorithm used.
     * @returns {boolean} True if the hash matches, false otherwise.
     */
    static verifyHash(data: string | Buffer, expectedHash: string, algorithm: 'sha256' | 'sha3-512' | 'sha384' = 'sha3-512'): boolean {
        return I_HASH_UTIL.execute({
            method: 'verify',
            data: data,
            expectedHash: expectedHash,
            algorithm: algorithm
        }) as boolean;
    }
}

export default SystemCryptoService;