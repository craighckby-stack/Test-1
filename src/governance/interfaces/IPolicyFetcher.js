/**
 * AGI-KERNEL Interface: ISecurePolicyLoaderToolKernel
 * Role: Defines the high-integrity, asynchronous interface for securely fetching and cryptographically
 * verifying external governance policies (E-01).
 *
 * Implementations of this kernel MUST delegate cryptographic verification (signature checking, integrity hashing)
 * to dedicated, audited Crypto Utility Kernels before resolving the mandates.
 */
class ISecurePolicyLoaderToolKernel {
    /**
     * Asynchronously fetches and cryptographically verifies the latest governance policies from the external source.
     *
     * @param {string} sourceUrl - The secured URL pointing to the governance mandate source.
     * @returns {Promise<{mandates: Readonly<Object>, tag: string}>} A promise resolving to the verified, immutable policy mandates object and its version tag.
     * @throws {Error} Throws if fetching fails or if cryptographic verification fails (e.g., data corruption, unauthorized source).
     */
    async fetchVerifiedPolicies(sourceUrl) {
        throw new Error('ISecurePolicyLoaderToolKernel: fetchVerifiedPolicies method must be implemented by the dependency.');
    }
}

module.exports = ISecurePolicyLoaderToolKernel;