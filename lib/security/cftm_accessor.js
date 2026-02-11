/**
 * CFTMAccessor (Core Failure Thresholds Manifest Accessor)
 * Implements strict, read-only access to immutable governance constants.
 * Pre-processes the config to ensure type-safe, optimized constant access.
 */

/**
 * Custom error type for configuration issues related to the CFTM.
 */
class CFTMConfigurationError extends Error {
    constructor(message, key) {
        super(`CFTM Error: ${message}${key ? ` (Key: ${key})` : ''}`);
        this.name = 'CFTMConfigurationError';
        this.key = key;
    }
}

/**
 * Abstracted processor for numerical constant maps.
 * Handles validation, flattening, and freezing, using CFTMConfigurationError for specialized context.
 */
class ImmutableNumericalConstantProcessor {
    /**
     * @param {object} rawConfig - The root configuration object.
     * @param {string} rootKey - The property name within rawConfig to process.
     * @param {Error} ErrorType - The specialized error class to throw.
     */
    constructor(rawConfig, rootKey, ErrorType) {
        if (!rawConfig || !rawConfig[rootKey]) {
            throw new ErrorType(`Missing or invalid '${rootKey}' configuration object.`);
        }

        const processedMap = {};
        const constants = rawConfig[rootKey];

        for (const key in constants) {
            if (Object.prototype.hasOwnProperty.call(constants, key)) {
                const constant = constants[key];

                // Enforce structure: Must be an object with a finite numerical 'value' property.
                if (constant === null || typeof constant !== 'object' || typeof constant.value !== 'number' || !isFinite(constant.value)) {
                    throw new ErrorType(
                        `Malformed constant entry. Expected { value: number, ... }, received invalid structure or non-finite number.`,
                        key
                    );
                }

                // Flatten the structure for direct numerical access efficiency
                processedMap[key] = constant.value;
            }
        }

        // Freeze the optimized, flattened map to enforce immutability.
        this._map = Object.freeze(processedMap);
        this._ErrorType = ErrorType;
    }

    /**
     * @param {string} key - The constant identifier.
     * @returns {number} The immutable numerical value.
     * @throws {Error} If the constant is not defined.
     */
    get(key) {
        const value = this._map[key];

        if (value === undefined) {
            throw new this._ErrorType(`Constant key not found.`, key);
        }

        return value;
    }
}

class CFTMAccessor {
    /**
     * @param {object} cftmConfig - The configuration object, expected to contain cftmConfig.thresholds.
     */
    constructor(cftmConfig) {
        // Delegate configuration processing, validation, and freezing to the specialized processor.
        this._processor = new ImmutableNumericalConstantProcessor(
            cftmConfig,
            'thresholds',
            CFTMConfigurationError
        );
    }

    /**
     * @param {string} key - The constant identifier.
     * @returns {number} The immutable numerical value.
     * @throws {CFTMConfigurationError} If the constant is not defined.
     */
    getThreshold(key) {
        return this._processor.get(key);
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

module.exports = { CFTMAccessor, CFTMConfigurationError };
