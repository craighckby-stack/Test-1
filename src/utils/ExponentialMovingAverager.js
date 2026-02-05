/**
 * Utility for maintaining a stable Exponential Moving Average (EMA).
 * O(1) complexity for updates and retrieval, ideal for high-frequency telemetry/statistics.
 */
class ExponentialMovingAverager {
    /**
     * @param {number} alpha - The smoothing factor (0.0 < alpha < 1.0). Lower is smoother.
     */
    constructor(alpha = 0.1) {
        if (alpha <= 0 || alpha >= 1) {
            throw new Error("Alpha (smoothing factor) must be strictly between 0 and 1.");
        }
        this.alpha = alpha;
        this.currentAverage = null;
        this.isInitialized = false;
    }

    /**
     * Updates the average with a new value.
     * @param {number} newValue 
     * @returns {number} The new calculated average.
     */
    update(newValue) {
        if (!this.isInitialized) {
            // First reading sets the initial average
            this.currentAverage = newValue;
            this.isInitialized = true;
        } else {
            // EMA calculation: Avg_t = (alpha * Value_t) + ((1 - alpha) * Avg_{t-1})
            this.currentAverage = (this.alpha * newValue) + ((1 - this.alpha) * this.currentAverage);
        }
        return this.currentAverage;
    }

    /**
     * Retrieves the current average.
     * @returns {number}
     */
    getAverage() {
        return this.currentAverage;
    }

    /**
     * Resets the averager state.
     */
    reset() {
        this.currentAverage = null;
        this.isInitialized = false;
    }
}

module.exports = ExponentialMovingAverager;