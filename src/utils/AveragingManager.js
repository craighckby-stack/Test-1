const ExponentialMovingAverager = require('./ExponentialMovingAverager');

/**
 * A central manager for multiple Exponential Moving Averager instances, 
 * useful for tracking various system metrics (e.g., latency, throughput, resource usage).
 */
class AveragingManager {
    constructor(defaultAlpha = 0.1) {
        this.averagers = new Map();
        this.defaultAlpha = defaultAlpha;
    }

    /**
     * Retrieves an existing averager or creates a new one if it doesn't exist.
     * @param {string} key - The unique identifier for the metric.
     * @param {number} [alpha] - Optional alpha smoothing factor for this specific averager.
     * @returns {ExponentialMovingAverager}
     */
    getAverager(key, alpha = this.defaultAlpha) {
        if (!this.averagers.has(key)) {
            const newAverager = new ExponentialMovingAverager(alpha);
            this.averagers.set(key, newAverager);
        }
        return this.averagers.get(key);
    }

    /**
     * Updates a specific metric with a new value.
     * Automatically creates the averager if necessary using the default alpha.
     * @param {string} key - The identifier for the metric.
     * @param {number} value - The new value for the average calculation.
     * @returns {number | null} The new calculated average.
     */
    update(key, value) {
        const averager = this.getAverager(key);
        return averager.update(value);
    }

    /**
     * Retrieves the current average for a specific metric key.
     * @param {string} key - The identifier for the metric.
     * @returns {number | null} The current average, or null if the key doesn't exist or hasn't initialized.
     */
    getAverage(key) {
        const averager = this.averagers.get(key);
        return averager ? averager.average : null;
    }

    /**
     * Retrieves all tracked averages as an object.
     * @returns {Object.<string, number | null>} Map of metric keys to their current averages.
     */
    getAllAverages() {
        const results = {};
        for (const [key, averager] of this.averagers.entries()) {
            results[key] = averager.average;
        }
        return results;
    }

    /**
     * Resets a single specific averager, or all averagers if no key is provided.
     * @param {string} [key] - Optional key to reset a specific averager.
     */
    reset(key) {
        if (key && this.averagers.has(key)) {
            this.averagers.get(key).reset();
        } else if (!key) {
            this.averagers.forEach(a => a.reset());
        }
    }
}

module.exports = AveragingManager;