/**
 * ExponentialSmoother: Implements an Exponential Weighted Moving Average (EWMA).
 * This utility provides a stable, averaged signal (S_t) from noisy data (Y_t) using a configurable alpha factor.
 */
class ExponentialSmoother {
    /**
     * @param {number} alpha - Smoothing factor (0 < alpha < 1). Lower alpha means more smoothing (slower response to change).
     * @param {number} initialValue - Starting value for the smoothed signal.
     */
    constructor(alpha, initialValue = 1.0) {
        if (alpha <= 0 || alpha >= 1) {
            // Defensive coding ensures alpha is valid for smoothing
            throw new Error("ExponentialSmoother: Alpha must be between 0 and 1.");
        }
        this.alpha = alpha;
        this.smoothedValue = initialValue;
    }

    /**
     * Updates the smoothed value based on a new observation.
     * Formula: S_t = (alpha * Y_t) + ((1 - alpha) * S_{t-1})
     * @param {number} newValue - The new raw observed data point.
     * @returns {number} The updated smoothed value.
     */
    update(newValue) {
        this.smoothedValue = 
            (this.alpha * newValue) + ((1 - this.alpha) * this.smoothedValue);
        
        return this.smoothedValue;
    }

    /**
     * Gets the current stable smoothed value.
     * @returns {number}
     */
    get() {
        return this.smoothedValue;
    }
}

module.exports = ExponentialSmoother;