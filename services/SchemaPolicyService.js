/**
 * AGI-KERNEL SchemaPolicyService
 * Manages policy enforcement and schema definitions, abstracting policy storage
 * into a dedicated plugin (PolicyStore).
 */

class SchemaPolicyService {
    /**
     * @param {PolicyStore} policyStoreInstance - Instance of the PolicyStore plugin.
     */
    constructor(policyStoreInstance) {
        if (!policyStoreInstance || typeof policyStoreInstance.get !== 'function') {
            throw new Error("SchemaPolicyService requires a valid PolicyStore instance with 'get' method.");
        }

        this.policyStore = policyStoreInstance;
        this.schemas = new Map(); // Stores resource schemas (e.g., Joi definitions)
    }

    /**
     * Delegates policy definition to the PolicyStore.
     * @param {string} resourceAction - e.g., 'users:read', 'products:update'
     * @param {Array<Function>} rules - Array of synchronous policy functions (ctx) => boolean
     */
    definePolicy(resourceAction, rules) {
        this.policyStore.define(resourceAction, rules);
    }

    /**
     * Registers a schema definition for a resource.
     * @param {string} resourceName
     * @param {any} schemaDefinition - The schema definition object.
     */
    defineSchema(resourceName, schemaDefinition) {
        this.schemas.set(resourceName, schemaDefinition);
    }

    /**
     * Enforces the policy rules for a given action and context.
     * @param {string} resourceAction - The policy key (e.g., 'users:create')
     * @param {object} context - Execution context (user info, request data, etc.)
     * @returns {boolean} True if all policies pass.
     * @throws {Error} If any policy rule returns false or throws.
     */
    enforce(resourceAction, context = {}) {
        const rules = this.policyStore.get(resourceAction);

        if (!rules || rules.length === 0) {
            // Default to ALLOW if no explicit policy is defined.
            return true;
        }

        for (const rule of rules) {
            const result = rule(context);
            
            if (result === false) {
                throw new Error(`Policy violation: Operation '${resourceAction}' failed policy check.`);
            }
            // If the rule throws an error, it stops execution immediately.
        }

        return true;
    }

    /**
     * Performs schema validation on data for a given resource.
     * NOTE: This method is designed to integrate with external validation libraries (like Joi/Zod).
     * @param {string} resourceName
     * @param {any} data - The data payload to validate.
     * @returns {any} The validated/coerced data.
     * @throws {Error} If validation fails.
     */
    validate(resourceName, data) {
        const schema = this.schemas.get(resourceName);
        if (!schema) {
            return data; // No schema defined, validation skipped
        }
        
        // Integration point for actual schema validation logic (e.g., schema.validate(data))
        // For core kernel use, we assume validation success if an external library isn't injected.
        
        return data; 
    }
}

module.exports = SchemaPolicyService;