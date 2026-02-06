/**
 * CFTMAccessor (Core Failure Thresholds Manifest Accessor)
 * Implements strict, read-only access to immutable governance constants.
 * Prevents runtime modification or incorrect type casting of critical threshold values.
 */
class CFTMAccessor {
    constructor(cftmConfig) {
        // Deep freeze the configuration to enforce 'Immutable' status
        this.thresholds = Object.freeze(JSON.parse(JSON.stringify(cftmConfig.thresholds)));
    }

    /**
     * @param {string} key - The constant identifier (e.g., 'DENOMINATOR_STABILITY_TAU').
     * @returns {number | null} The immutable numerical value.
     * @throws {Error} If the constant is not defined or is not a numerical type.
     */
    getThreshold(key) {
        const constant = this.thresholds[key];
        if (!constant) {
            throw new Error(`CFTM Error: Constant key '${key}' not found.`);
        }
        if (typeof constant.value !== 'number') {
            throw new TypeError(`CFTM Error: Constant '${key}' value is not a number.`);
        }
        // Optional: Implement check for 'precision' and 'type' constraints here
        return constant.value;
    }

    /**
     * Specialized accessor for Stability Tau (for GAX-S-02.1).
     * @returns {number}
     */
    getStabilityTau() {
        return this.getThreshold('DENOMINATOR_STABILITY_TAU');
    }

    /**
     * Specialized accessor for Efficacy Safety Margin (for GAX-P-01.2).
     * @returns {number}
     */
    getEfficacySafetyMargin() {
        return this.getThreshold('MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON');
    }
}

module.exports = CFTMAccessor;