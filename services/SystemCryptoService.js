/**
 * SystemCryptoService v1.0.0 (Sovereign AGI)
 * Provides secure cryptographic hashing utilities for verifying system component integrity.
 * This service is critical for auditing configuration manifest (SPDM) integrity.
 */

type HashingAlgorithm = 'sha256' | 'sha3-512' | 'sha384';

// Define the expected interface for the runtime injected plugin
interface IIntegrityHashingUtility {
    execute(options: { method: 'hash', data: string | Buffer, algorithm: HashingAlgorithm }): string;
    execute(options: { method: 'verify', data: string | Buffer, expectedHash: string, algorithm: HashingAlgorithm }): boolean;
}

// AGI Kernel Plugin Reference (Conceptual/Injected Dependency)
const I_HASH_UTIL: IIntegrityHashingUtility = (globalThis as any).__KERNEL_PLUGINS?.IntegrityHashingUtility || {
    // Provide a safe stub for runtime safety if the plugin is missing
    execute: (options: any) => {
        throw new Error(`IntegrityHashingUtility is not loaded. Cannot perform ${options.method || 'operation'}.`);
    }
};

class SystemCryptoService {

    /**
     * Generates a cryptographic hash for data integrity verification.
     * @param {string | Buffer} data - The input data to hash (e.g., stringified JSON).
     * @param {HashingAlgorithm} algorithm - The hashing algorithm to use.
     * @returns {string} The hash digest in hexadecimal format (prefixed with 0x).
     */
    static hash(data: string | Buffer, algorithm: HashingAlgorithm = 'sha3-512'): string {
        try {
            return I_HASH_UTIL.execute({ 
                method: 'hash',
                data: data,
                algorithm: algorithm
            });
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
     * @param {HashingAlgorithm} algorithm - The hashing algorithm used.
     * @returns {boolean} True if the hash matches, false otherwise.
     */
    static verifyHash(data: string | Buffer, expectedHash: string, algorithm: HashingAlgorithm = 'sha3-512'): boolean {
        try {
            return I_HASH_UTIL.execute({
                method: 'verify',
                data: data,
                expectedHash: expectedHash,
                algorithm: algorithm
            });
        } catch (error: any) {
            // Handle critical system failures (e.g., plugin not loaded) separately from verification failure (returning false).
            console.error("SystemCryptoService verification error:", error.message);
            if (error.message.includes("IntegrityHashingUtility is not loaded")) {
                 throw new Error("CRITICAL SECURITY FAILURE: Integrity check subsystem offline.");
            }
            return false;
        }
    }
}

export default SystemCryptoService;