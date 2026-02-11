import { TimeSeriesDeltaValidator } from '../../plugins/validation/TimeSeriesDeltaValidator.js';

/**
 * Configuration constants for physiological plausibility.
 */
const GSR_PARAMS = {
    MIN_CONDUCTANCE_uS: 0.05, // Lower physiological limit (microsiemens)
    MAX_CONDUCTANCE_uS: 50.0, // Upper physiological limit
    // Rate of change used by the TimeSeriesDeltaValidator plugin
    MAX_RATE_OF_CHANGE_uS_PER_MS: 0.1,
};

/**
 * @typedef {object} GSRReading
 * @property {number} timestamp - Time in milliseconds.
 * @property {number} conductance_uS - Galvanic Skin Response reading (microsiemens).
 */

/**
 * Validates GSR readings based on static ranges and dynamic rate-of-change limits.
 * Abstraction is achieved by delegating sequence consistency checks to the reusable TimeSeriesDeltaValidator.
 */
class GSR_Validator {
    static config = GSR_PARAMS;

    /**
     * Static instance of the reusable rate validator, configured for GSR data.
     */
    static deltaValidator = new TimeSeriesDeltaValidator(
        GSR_PARAMS.MAX_RATE_OF_CHANGE_uS_PER_MS,
        'conductance_uS' // The key containing the value to track changes on
    );

    /**
     * Checks basic structural integrity and static range bounds for a single reading.
     * @param {GSRReading} reading
     * @returns {boolean} True if the structure and value are valid.
     */
    static validateReading(reading) {
        // Use optional chaining and direct type check for maximum efficiency
        if (typeof reading?.conductance_uS !== 'number' || typeof reading.timestamp !== 'number') {
            return false;
        }

        const value = reading.conductance_uS;

        // High-speed range check
        if (value < GSR_PARAMS.MIN_CONDUCTANCE_uS || value > GSR_PARAMS.MAX_CONDUCTANCE_uS) {
            return false;
        }

        // Time must be non-negative
        if (reading.timestamp < 0) {
            return false;
        }

        return true;
    }

    /**
     * Validates an entire time-ordered sequence of readings.
     * 1. Iterates rapidly to ensure all readings are individually valid (range check).
     * 2. Delegates rate-of-change and monotonicity checks to the abstracted validator.
     * @param {GSRReading[]} readings
     * @returns {boolean} True if the entire sequence is valid and consistent.
     */
    static validateSequence(readings) {
        if (!Array.isArray(readings) || readings.length === 0) {
            return true; // Trivially valid sequence
        }

        // Phase 1: Range and Structure Check (Optimized for fail-fast)
        for (let i = 0; i < readings.length; i++) {
            if (!GSR_Validator.validateReading(readings[i])) {
                return false;
            }
        }

        // Phase 2: Dynamic Delta and Monotonicity Check (Abstracted)
        return GSR_Validator.deltaValidator.validateSequence(readings);
    }
}

export default GSR_Validator;