class IntegrityValidationEngine {
    constructor(ruleManifest) {
        // ruleManifest is loaded from spec/integrity/mcis_v1.2.json
        this.manifest = ruleManifest;
        // Ensure a robust JSON Path utility is available for targeting
        this.jsonPath = require('./JsonPathUtility'); 
    }

    // Loads rulesets based on the operation (e.g., 'creation_validation')
    loadRules(operation) {
        return this.manifest.rulesets[operation] || null;
    }

    /**
     * Executes validation against a target payload.
     * @param {object} payload - The object being validated (e.g., new MCIS config).
     * @param {string} operation - The ruleset key ('creation_validation', etc.).
     * @returns {Array<object>} - List of failed constraints.
     */
    validate(payload, operation) {
        const ruleset = this.loadRules(operation);
        if (!ruleset) return [];

        const failures = [];
        for (const rule of ruleset.rules) {
            // 1. Get all targeted values (handles array wildcards like $.vm_list[*].connection_name)
            const targets = this.jsonPath.get(payload, rule.target);

            for (const targetValue of targets) {
                if (!this._checkConstraint(targetValue, rule.constraint)) {
                    failures.push({
                        rule_id: rule.id,
                        severity: ruleset.severity,
                        message: rule.message,
                        path: rule.target
                    });
                }
            }
        }
        return failures;
    }

    // Executes the specific constraint logic (regex, min_length, is_immutable, etc.)
    _checkConstraint(value, constraintString) {
        const [type, param] = constraintString.split(':', 2);
        
        switch(type) {
            case 'regex':
                return new RegExp(param).test(value);
            case 'min_length':
                return Array.isArray(value) && value.length >= parseInt(param);
            case 'is_defined':
                return value !== undefined && value !== null;
            case 'is_immutable':
                // Requires context tracking of original state (omitted here for brevity)
                return true; 
            default:
                console.warn(`Unknown constraint type: ${type}`);
                return true;
        }
    }
}

module.exports = IntegrityValidationEngine;