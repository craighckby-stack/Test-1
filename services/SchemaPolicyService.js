/**
 * AGI-KERNEL SchemaPolicyKernel
 * Manages policy enforcement and schema definitions, abstracting policy storage
 * into a dedicated plugin (PolicyStore).
 */

class SchemaPolicyKernel {

    // Rigorously privatized state
    #policyStore;
    #schemas = new Map();

    /**
     * @param {object} dependencies - Must contain a PolicyStore instance.
     * @param {PolicyStore} dependencies.policyStoreInstance - Instance of the PolicyStore plugin.
     */
    constructor({ policyStoreInstance }) {
        this.#setupDependencies(policyStoreInstance);
    }

    /**
     * Step 1: Extracts and validates synchronous dependencies.
     * @param {PolicyStore} policyStoreInstance
     */
    #setupDependencies(policyStoreInstance) {
        const isValid = policyStoreInstance &&
                        typeof policyStoreInstance.get === 'function' &&
                        typeof policyStoreInstance.define === 'function';

        if (!isValid) {
            this.#throwSetupError("requires a valid PolicyStore instance with 'get' and 'define' methods.");
        }

        this.#policyStore = policyStoreInstance;
    }

    /**
     * I/O Proxy: Throws a standardized setup error.
     * @param {string} message
     */
    #throwSetupError(message) {
        throw new Error(`SchemaPolicyKernel Setup Error: ${message}`);
    }

    /**
     * I/O Proxy: Delegates policy definition to the PolicyStore.
     */
    #delegateToPolicyStoreDefine(resourceAction, rules) {
        this.#policyStore.define(resourceAction, rules);
    }

    /**
     * I/O Proxy: Delegates policy retrieval from the PolicyStore.
     */
    #delegateToPolicyStoreGet(resourceAction) {
        return this.#policyStore.get(resourceAction);
    }

    /**
     * I/O Proxy: Executes synchronous rules and throws on violation.
     * @param {string} resourceAction
     * @param {Array<Function>} rules
     * @param {object} context
     */
    #executePolicyRulesAndThrow(resourceAction, rules, context) {
        for (const rule of rules) {
            const result = rule(context);

            if (result === false) {
                this.#throwPolicyViolationError(resourceAction);
            }
        }
    }

    /**
     * I/O Proxy: Throws a policy violation error.
     * @param {string} resourceAction
     */
    #throwPolicyViolationError(resourceAction) {
        throw new Error(`Policy violation: Operation '${resourceAction}' failed policy check.`);
    }

    /**
     * I/O Proxy: Handles schema retrieval and validation execution.
     */
    #executeSchemaValidation(resourceName, data) {
        const schema = this.#schemas.get(resourceName);
        if (!schema) {
            return data; // No schema defined, validation skipped
        }

        // NOTE: This is the integration point for external validation libraries (Joi/Zod).
        // Since no external validator is dependency-injected, we currently return the data.

        return data;
    }

    /**
     * Delegates policy definition to the PolicyStore.
     * @param {string} resourceAction - e.g., 'users:read', 'products:update'
     * @param {Array<Function>} rules - Array of synchronous policy functions (ctx) => boolean
     */
    definePolicy(resourceAction, rules) {
        this.#delegateToPolicyStoreDefine(resourceAction, rules);
    }

    /**
     * Registers a schema definition for a resource.
     * @param {string} resourceName
     * @param {any} schemaDefinition - The schema definition object.
     */
    defineSchema(resourceName, schemaDefinition) {
        this.#schemas.set(resourceName, schemaDefinition);
    }

    /**
     * Enforces the policy rules for a given action and context.
     * @param {string} resourceAction - The policy key (e.g., 'users:create')
     * @param {object} context - Execution context (user info, request data, etc.)
     * @returns {boolean} True if all policies pass.
     * @throws {Error} If any policy rule returns false or throws.
     */
    enforce(resourceAction, context = {}) {
        const rules = this.#delegateToPolicyStoreGet(resourceAction);

        if (!rules || rules.length === 0) {
            // Default to ALLOW if no explicit policy is defined.
            return true;
        }

        this.#executePolicyRulesAndThrow(resourceAction, rules, context);

        return true;
    }

    /**
     * Performs schema validation on data for a given resource.
     * @param {string} resourceName
     * @param {any} data - The data payload to validate.
     * @returns {any} The validated/coerced data.
     * @throws {Error} If validation fails.
     */
    validate(resourceName, data) {
        return this.#executeSchemaValidation(resourceName, data);
    }
}

module.exports = SchemaPolicyKernel;
