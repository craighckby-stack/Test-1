// core/utils/CoreCryptographicVerifier.js

import { MerkleProofVerifierTool } from '@/plugins/MerkleProofVerifierTool';
import { IntegrityHashingUtility } from '@/plugins/IntegrityHashingUtility';

/**
 * CoreCryptographicVerifier
 * Utility class for advanced state integrity verification (Merkle Proofs, HMACs).
 * This is crucial for systems relying on root hashes (like SCL), as verification 
 * should prove inclusion cryptographically, not just rely on DB consistency.
 */
export class CoreCryptographicVerifier {

    /**
     * Standardized SHA-256 Hashing for internal primitives.
     * Delegates hashing responsibility to the centralized IntegrityHashingUtility.
     *
     * @param {string|Buffer} data
     * @returns {string} Hex encoded hash
     */
    static hash(data: string | Buffer): string {
        return CoreCryptographicVerifier.#delegateToHashingUtility(data);
    }

    /**
     * Verifies a Merkle Proof against a known Merkle Root.
     * Delegates complex cryptographic path verification logic to the specialized MerkleProofVerifierTool.
     *
     * @param {string} rootHash - The expected Merkle Root Hash.
     * @param {string} leafData - The data whose inclusion needs to be proven.
     * @param {Array<{hash: string, position: 'left' | 'right'}>} proofPath - Array of proof nodes.
     * @returns {boolean} True if the proof verifies.
     */
    static verifyMerkleProof(
        rootHash: string,
        leafData: string,
        proofPath: Array<{hash: string, position: 'left' | 'right'}>
    ): boolean {
        return CoreCryptographicVerifier.#delegateToProofVerifier({
            rootHash,
            leafData,
            proofPath
        });
    }

    /**
     * Private static I/O Proxy function.
     * Delegates synchronous hashing execution to the external IntegrityHashingUtility tool.
     */
    static #delegateToHashingUtility(data: string | Buffer): string {
        return IntegrityHashingUtility.calculateSha256(data);
    }

    /**
     * Private static I/O Proxy function.
     * Delegates synchronous Merkle Proof verification execution to the external MerkleProofVerifierTool.
     */
    static #delegateToProofVerifier(params: {
        rootHash: string,
        leafData: string,
        proofPath: Array<{hash: string, position: 'left' | 'right'}>
    }): boolean {
        return MerkleProofVerifierTool.execute(params);
    }
}