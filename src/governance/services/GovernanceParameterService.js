class GovernanceParameterService {
    /**
     * @param {object} config - The governanceParams.json structure.
     */
    constructor(config) {
        this.parameters = config.parameters;
    }

    /**
     * Fetches a parameter value, ensuring it adheres to its defined type.
     * @param {string} key - Parameter ID (e.g., 'RISK_ALIGNMENT_CRITICAL_DEVIATION_MAX').
     * @returns {number|string|boolean} The validated parameter value.
     * @throws {Error} If parameter is not found.
     */
    getParam(key) {
        const param = this.parameters[key];
        if (!param) {
            throw new Error(`Governance parameter not found: ${key}`);
        }
        // NOTE: In a full implementation, complex type validation and coercion would happen here.
        return param.default; 
    }

    /**
     * Checks if a specific parameter can be modified by autonomous agents.
     * @param {string} key - Parameter ID.
     * @returns {boolean}
     */
    isTunable(key) {
        const param = this.parameters[key];
        return param ? param.is_tunable : false;
    }

    /**
     * Verifies if a proposed new value is within the defined range.
     * @param {string} key - Parameter ID.
     * @param {*} newValue - Proposed new value.
     * @returns {boolean}
     */
    validateRange(key, newValue) {
        const param = this.parameters[key];
        if (!param || !param.range) return true;
        
        const [min, max] = param.range;
        if (param.type === 'float' || param.type === 'integer') {
            return newValue >= min && newValue <= max;
        }
        // Placeholder for complex validation
        return true;
    }
}
module.exports = GovernanceParameterService;