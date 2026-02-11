/**
 * Constants defining standard types and severity levels for validation rules.
 */
const RuleSeverity = Object.freeze({
    ERROR: 'ERROR',     // Blocks execution/deployment
    WARNING: 'WARNING', // Permitted, but logged for review
    INFO: 'INFO'        // Informational checks
});

const RuleType = Object.freeze({
    COHERENCE: 'COHERENCE', // Checks related entity consistency (e.g., hard/soft limits)
    VERSIONING: 'VERSIONING', // Checks dependency compatibility
    STRUCTURAL: 'STRUCTURAL', // Checks required fields and data format
    POLICY: 'POLICY' // Checks against governance or ethical constraints
});

/**
 * @typedef {Object} ValidationRule
 * @property {string} id - Unique identifier for the rule (e.g., 'spec.memoryLimitCoherence').
 * @property {string} type - The category of the rule (must be a value from RuleType).
 * @property {string} severity - The impact level (must be a value from RuleSeverity).
 * @property {string} description - Human-readable explanation of the rule.
 * @property {string} targetPath - The path within the input structure the rule applies to (dot notation).
 * @property {string} handlerId - Identifier used by the Validation Execution Engine to locate the handler function/method.
 */

/**
 * Sovereign AGI Validation Rule Configuration Registry.
 * Defines standard rule structures used for initialization by Validators.
 * Rules must specify an `id`, `type`, `severity`, and the `handlerId` used 
 * by the validation execution engine for lookup and injection.
 */

/**
 * @type {{
 *   RuleSeverity: typeof RuleSeverity,
 *   RuleType: typeof RuleType,
 *   chrSpecRules: ValidationRule[],
 *   policyRules: ValidationRule[]
 * }}
 */
module.exports = {
    RuleSeverity,
    RuleType,
    
    /**
     * Rules applied to the CHR Generation Specification (`spec`).
     * The `handlerId` should map directly to an exported function/class method
     * in the system's RuleHandler registry.
     * @type {ValidationRule[]}
     */
    chrSpecRules: [
        {
            id: 'spec.memoryLimitCoherence',
            type: RuleType.COHERENCE,
            severity: RuleSeverity.ERROR,
            description: 'Ensure hard memory limit is not below the soft limit set in configuration.',
            targetPath: 'config.memoryLimits', // Indicates the path in the input structure
            handlerId: 'MemoryRuleHandler.checkLimitCoherence'
        },
        {
            id: 'spec.dependencyCompatibility',
            type: RuleType.VERSIONING,
            severity: RuleSeverity.ERROR,
            description: 'Verify all required internal component versions are compatible with the current runtime protocol.',
            targetPath: 'dependencies',
            handlerId: 'SystemRuleHandler.checkRuntimeCompatibility'
        },
        {
            id: 'spec.requiredFieldsExist',
            type: RuleType.STRUCTURAL,
            severity: RuleSeverity.ERROR,
            description: 'Verify core mandatory fields (like Agent ID and Mission Objective) are defined.',
            targetPath: 'metadata',
            handlerId: 'StructuralRuleHandler.checkRequiredFields'
        }
    ],
    
    // Policy and governance rules requiring specialized handlers
    policyRules: []
};
