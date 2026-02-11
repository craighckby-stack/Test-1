const JsonPathUtility = require('./JsonPathUtility');

/**
 * IntegrityValidationEngine manages the loading, caching, and application of integrity rules
 * against a payload, relying on external services for constraint compilation and path traversal.
 */
class IntegrityValidationEngine {
    /**
     * @param {object} ruleManifest - Loaded manifest defining rule sets.
     * @param {ConstraintEvaluator} constraintEvaluator - Service handling constraint parsing and compilation.
     */
    constructor(ruleManifest, constraintEvaluator) {
        // ruleManifest is loaded from spec/integrity/mcis_v1.2.json
        this.manifest = ruleManifest;
        // Utilize the utility; ensure external registration if the system grows.
        this.jsonPath = JsonPathUtility;
        this.evaluator = constraintEvaluator; 
        this.compiledRulesCache = {};
    }

    /**
     * Loads rulesets based on the operation and caches compiled versions.
     */
    loadRules(operation) {
        if (this.compiledRulesCache[operation]) {
            return this.compiledRulesCache[operation];
        }

        const rawRuleset = this.manifest.rulesets[operation];
        if (!rawRuleset) return null;

        const compiledRuleset = {
            ...rawRuleset,
            rules: rawRuleset.rules.map(rule => ({
                ...rule,
                // Delegate compilation to the external evaluator service
                compiledConstraint: this.evaluator.compile(rule.constraint)
            }))
        };

        this.compiledRulesCache[operation] = compiledRuleset;
        return compiledRuleset;
    }

    /**
     * Creates a detailed failure object for standardized reporting.
     */
    _createFailure(rule, severity, value) {
        // Truncate long values for logging clarity but retain type/path information
        const displayValue = (value === undefined || value === null) 
            ? 'N/A' 
            : (typeof value === 'object' ? JSON.stringify(value) : String(value));

        const actual_value = displayValue.length > 256 
            ? displayValue.substring(0, 253) + '...'
            : displayValue;

        return {
            rule_id: rule.id,
            severity: severity,
            message: rule.message,
            path: rule.target,
            constraint_type: rule.compiledConstraint.type,
            actual_value: actual_value
        };
    }

    /**
     * Executes validation against a target payload.
     * @param {object} payload - The object being validated.
     * @param {string} operation - The ruleset key ('creation_validation', etc.).
     * @returns {Array<object>} - List of failed constraints.
     */
    validate(payload, operation) {
        const ruleset = this.loadRules(operation);
        if (!ruleset) return [];

        const failures = [];

        for (const rule of ruleset.rules) {
            const { target, compiledConstraint } = rule;
            
            // 1. Get all targeted values (JSON Path query)
            const targets = this.jsonPath.get(payload, target);

            // If JSONPath resolves to an empty array (path not found/list empty),
            // this is a failure only if the constraint explicitly checks for presence.
            if (targets.length === 0) {
                 if (compiledConstraint.type === 'is_defined') {
                      // Failed definition check because the path resolved to nothing in the payload structure.
                      failures.push(this._createFailure(rule, ruleset.severity, undefined));
                 }
                 continue;
            }

            for (const targetValue of targets) {
                // 2. Execute pre-compiled constraint check
                if (!compiledConstraint.check(targetValue)) {
                    failures.push(this._createFailure(rule, ruleset.severity, targetValue));
                }
            }
        }
        return failures;
    }
}

module.exports = IntegrityValidationEngine;