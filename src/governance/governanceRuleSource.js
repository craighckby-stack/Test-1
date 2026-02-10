/**
 * @typedef {Object} P01Constants
 * @property {number} threshold
 * @property {Object<string, number>} weights
 */
/**
 * @typedef {Object} VetoRule
 * @property {string} id
 * @property {string} description
 * @property {string} policy
 * @property {(number|string)} value
 * @property {string} enforced_by
 */
/**
 * @typedef {Object} GovernanceRuleSchema
 * @property {P01Constants} P01_CRITICALITY
 * @property {VetoRule[]} GSEP_VETO_RULES
 */

/**
 * GRS: GOVERNANCE RULE SOURCE (V95.3)
 * Scope: Stage 3/Foundation. Critical dependency for P-01 consensus.
 * Function: Provides an immutable, cryptographically verifiable source of truth
 * for the core system policy rule sets and fixed P-01 calculation constants.
 * It mandates defensive copying on all output to guarantee rule integrity.
 */
class GovernanceRuleSource {
    #registry;
    #currentRuleSetVersion: string;
    /** @type {GovernanceRuleSchema} */
    #immutableRuleset: GovernanceRuleSchema;

    /**
     * Executes the DefensiveCopyTool plugin to create a deep copy.
     * Assumes the tool is accessible via the registry's tool execution layer.
     * @private
     * @template T
     * @param {T} obj
     * @returns {T}
     */
    #cloneRuleData<T>(obj: T): T {
        // In a deployed AGI-KERNEL system, this would execute the defined plugin.
        // We simulate the execution call using structural knowledge of the plugin interface.
        const tool = this.#registry?.tools?.DefensiveCopyTool;
        
        if (tool && typeof tool.execute === 'function') {
             // CRITICAL: We rely on the DefensiveCopyTool for maintaining rule immutability.
             return (tool.execute({ obj: obj }) as T);
        }

        // Defensive Fallback (ONLY if tool injection fails, which is a critical system error)
        console.warn("GRS::TOOL_MISSING - DefensiveCopyTool missing. Falling back to native JSON clone.");
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error("GRS::CLONE_FAILURE - Critical fallback cloning failure.", e);
            return obj;
        }
    }

    /**
     * @param {Object} registry - Provides access to necessary services (including tools).
     */
    constructor(registry) {
        if (!registry) {
            throw new Error("GRS initialization requires a valid system registry.");
        }
        this.#registry = registry;
        
        this.#initializeSource();
        
        // Post-Load integrity checks (e.g., structure validation, schema adherence)
        this.#validateRulesetIntegrity(this.#immutableRuleset);
    }

    /**
     * Synchronous blocking initialization handler.
     */
    #initializeSource() {
        // This process MUST be synchronous and blocking upon initialization 
        // as the system cannot run without verified foundational rules.
        const verifiedSource = this.#fetchVerifiedRuleset();
        this.#currentRuleSetVersion = verifiedSource.version;
        this.#immutableRuleset = verifiedSource.ruleset;
    }

    /**
     * Placeholder for the crucial secure retrieval mechanism.
     * In production, this uses the registry's SSV to fetch and verify the hash.
     * @returns {{version: string, ruleset: GovernanceRuleSchema}}
     */
    #fetchVerifiedRuleset() {
        // --- HARDCODED MOCK DATA FOR DEMONSTRATION ---
        const version = 'V95.3.0-AOC'; 
        return {
            version: version,
            ruleset: {
                // P01: System Criticality Determination Constants
                "P01_CRITICALITY": {
                    "threshold": 0.65, 
                    "weights": {
                        "S01_PSR_WEIGHT": 0.7, 
                        "S01_ATM_WEIGHT": 0.3
                    }
                },
                // GSEP: Governance and System Enforcement Policies (Hard Veto Rules)
                "GSEP_VETO_RULES": [
                    { id: "HR01", description: "Preventing self-modification of core memory allocation greater than 5% per cycle.", policy: "MEM_ALLOC_DELTA_LIMIT", value: 0.05, enforced_by: "C-15" },
                    { id: "HR02", description: "Mandatory immediate rollback upon C-04 integrity failure.", policy: "C04_EXIT_CODE", value: "NON_ZERO", enforced_by: "C-04" }
                ]
            }
        };
        // ---------------------------------------------
    }

    /**
     * Ensures the ruleset conforms to the required schema.
     * @param {GovernanceRuleSchema} ruleset 
     */
    #validateRulesetIntegrity(ruleset) {
        if (!ruleset || !ruleset.P01_CRITICALITY || !Array.isArray(ruleset.GSEP_VETO_RULES)) {
            console.error("GRS integrity failure: Ruleset schema mismatch.", ruleset);
            throw new Error("GRS: Loaded ruleset fails structural integrity validation.");
        }
        // Further depth checks would occur here.
    }

    /**
     * @returns {string} The cryptographically attested version string of the loaded ruleset.
     */
    getRulesetVersion() {
        return this.#currentRuleSetVersion;
    }

    /**
     * Returns a deep clone of the mandatory GSEP policies.
     * @returns {VetoRule[]} 
     */
    getMandatoryVetoPolicies() {
        return this.#cloneRuleData(this.#immutableRuleset.GSEP_VETO_RULES);
    }

    /**
     * Returns a deep clone of the P01 calculation constants.
     * @returns {P01Constants}
     */
    getP01Constants() {
        return this.#cloneRuleData(this.#immutableRuleset.P01_CRITICALITY);
    }

    /**
     * Retrieves a deep clone of a specific rule block.
     * @param {string} key - The key of the ruleset block (e.g., 'P01_CRITICALITY').
     * @returns {Object|Array} A deep cloned copy of the rule block data.
     */
    getRuleBlock(key) {
        const ruleBlock = this.#immutableRuleset[key];
        if (ruleBlock === undefined) {
            throw new Error(`GRS::RULE_NOT_FOUND - Unknown rule block requested: ${key}`);
        }
        return this.#cloneRuleData(ruleBlock);
    }

    /**
     * Performs a check against the system's current verified hash.
     * @param {string} manifestHash - The expected cryptographic hash of the GRS manifest.
     * @returns {boolean}
     */
    verifyIntegrity(manifestHash) {
        if (!this.#registry.ssv) {
            console.warn("SSV component required in registry to perform rule integrity verification.");
            return false;
        }
        
        // Retrieve the hash of the currently loaded ruleset from the SSV component.
        const currentVerifiedHash = this.#registry.ssv.getRuleSourceHash(this.#currentRuleSetVersion);
        
        return currentVerifiedHash === manifestHash;
    }
}

module.exports = GovernanceRuleSource;