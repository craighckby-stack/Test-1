/**
 * src/engine/DialAnalysisRuleEngine.js
 * Rule engine designed to parse and execute the structured logic defined in config/dial_analysis_map.json.
 * It translates raw telemetry metrics into preconditions and executes complex logical rules.
 */

class DialAnalysisRuleEngine {
    constructor(config) {
        this.config = config;
        this.metricsConfig = config.metrics_config;
        this.preconditions = config.precondition_definitions;
        this.rules = config.response_rules.sort((a, b) => b.priority - a.priority); // Sort high priority first
    }

    /**
     * Evaluates raw telemetry against defined metrics_config to derive boolean preconditions.
     * @param {Object<string, number>} telemetry - Runtime sensor readings (e.g., { 'MPAM_deviation': 0.06 }).
     * @returns {Object<string, boolean>} Derived boolean preconditions (e.g., { 'SEV_DEVIATION_MPAM': true }).
     */
    derivePreconditions(telemetry) {
        const derived = {};
        
        for (const [key, definition] of Object.entries(this.preconditions)) {
            const metricKey = definition.check;
            const metricConf = this.metricsConfig[metricKey];
            const value = telemetry[metricKey];

            if (metricConf && value !== undefined) {
                const { threshold, operator } = metricConf;
                let isViolated = false;

                if (operator === 'GT') { isViolated = value > threshold; }
                if (operator === 'LT') { isViolated = value < threshold; }
                // Add EQ/GTE/LTE handlers here as needed

                derived[key] = isViolated;
            }
        }
        return derived;
    }

    /**
     * Executes response rules against derived preconditions, respecting rule priority.
     * @param {Object<string, boolean>} derivedPreconditions
     * @returns {string | null} The determined output action or null.
     */
    executeRules(derivedPreconditions) {
        for (const rule of this.rules) {
            const { logic, output } = rule;
            let result = false;
            
            if (logic.operator === "OR") {
                result = logic.references.some(ref => derivedPreconditions[ref] === true);
            } else if (logic.operator === "AND") {
                result = logic.references.every(ref => derivedPreconditions[ref] === true);
            } else if (logic.operator === "NOT_ANY") {
                result = !logic.references.some(ref => derivedPreconditions[ref] === true);
            } else if (logic.operator === "DEFAULT") {
                result = true;
            }

            if (result) {
                return output; 
            }
        }
        return null; // No rule matched
    }
}

// export default DialAnalysisRuleEngine;