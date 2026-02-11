/**
 * AGI-KERNEL ConceptualPolicyRegistry
 * 
 * Manages the registration and retrieval of conceptual policies, ensuring
 * O(1) lookup efficiency and integrity via configuration freezing.
 */

import { IdMapRegistry } from "../../plugins/IdMapRegistry";

/**
 * @typedef {Object} Policy
 * @property {string} name - Human readable name.
 * @property {string} description - What the policy governs.
 * @property {Object} config - The configuration payload enforced by the policy.
 */

class ConceptualPolicyRegistry {
    /**
     * @type {IdMapRegistry<Policy>} Internal map implementation for O(1) access.
     */
    #registry = new IdMapRegistry();

    /**
     * Registers a new conceptual policy.
     * 
     * Ensures the policy object contains a 'config' payload and freezes the object
     * to guarantee integrity post-registration.
     * 
     * @param {string} policyId - Unique identifier for the policy (e.g., 'CONCURRENCY_LIMIT_POLICY').
     * @param {Policy} policy - The policy object.
     */
    registerPolicy(policyId, policy) {
        if (!policy || typeof policy.config === 'undefined') {
            throw new Error(`Integrity Error: Policy registration for ID: ${policyId} failed. Policy structure must contain a 'config' payload.`);
        }
        
        // Freeze the policy configuration to enforce runtime immutability
        const immutablePolicy = Object.freeze(policy);
        
        this.#registry.register(policyId, immutablePolicy);
    }

    /**
     * Retrieves a registered policy by its ID.
     * 
     * @param {string} policyId - The unique identifier of the policy.
     * @returns {Policy | undefined} The policy object, or undefined if not found.
     */
    getPolicy(policyId) {
        return this.#registry.get(policyId);
    }

    /**
     * Retrieves the configuration payload for a specific policy.
     * 
     * @param {string} policyId - The unique identifier of the policy.
     * @returns {Object | undefined} The configuration payload.
     */
    getPolicyConfig(policyId) {
        const policy = this.getPolicy(policyId);
        return policy ? policy.config : undefined;
    }

    /**
     * Checks if a policy is registered.
     * @param {string} policyId - The unique identifier of the policy.
     * @returns {boolean} True if registered, false otherwise.
     */
    hasPolicy(policyId) {
        return this.#registry.has(policyId);
    }

    /**
     * Returns an iterable of all registered policy IDs.
     * @returns {IterableIterator<string>}
     */
    keys() {
        return this.#registry.keys();
    }
    
    /**
     * Clears all registered policies. Use only for controlled environment reset.
     */
    clear() {
        this.#registry.clear();
    }
}

export { ConceptualPolicyRegistry };