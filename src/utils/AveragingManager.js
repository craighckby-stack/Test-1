const ExponentialMovingAverager = require('./ExponentialMovingAverager');

/**
 * @typedef {ExponentialMovingAverager} AveragerInstance
 * @type {Map<string, AveragerInstance>}
 */

/**
 * A central manager for multiple Averager instances, primarily utilizing Exponential Moving Averages 
 * for tracking system metrics (e.g., latency, throughput, resource usage).
 * 
 * Provides robust metric management, auto-creation, and comprehensive aggregation.
 */
class AveragingManager {
    
    /**
     * @private
     * @readonly
     */
    static #AveragerType = ExponentialMovingAverager;

    /**
     * @param {number} [defaultAlpha=0.1] - The smoothing factor (0 to 1) used for new EMAs created without a specific alpha value.
     */
    constructor(defaultAlpha = 0.1) {
        
        if (typeof defaultAlpha !== 'number' || defaultAlpha <= 0 || defaultAlpha >= 1) {
             // Treat invalid input defensively and set a standard fallback.
             console.warn(`AveragingManager received invalid default alpha: ${defaultAlpha}. Falling back to 0.1.`);
             this._defaultAlpha = 0.1;
        } else {
            /** @private @type {number} */
            this._defaultAlpha = defaultAlpha;
        }

        /** @private @type {Map<string, AveragerInstance>} */
        this._averagers = new Map();
    }
    
    /**
     * Validates and returns an effective alpha value, falling back to the default if necessary.
     * @param {number | undefined} alpha
     * @returns {number}
     */
    _getEffectiveAlpha(alpha) {
        return (typeof alpha === 'number' && alpha > 0 && alpha < 1) ? alpha : this._defaultAlpha;
    }

    /**
     * Retrieves an existing averager or creates a new one using ExponentialMovingAverager.
     * Note: If the averager exists, subsequent calls supplying a new alpha will be ignored.
     * 
     * @param {string} key - The unique identifier for the metric.
     * @param {number} [alpha] - Optional alpha smoothing factor for this specific averager (only used on creation).
     * @returns {AveragerInstance}
     * @throws {Error} If the provided key is invalid.
     */
    getAverager(key, alpha) {
        if (typeof key !== 'string' || key.trim() === '') {
            throw new Error("AveragingManager key must be a non-empty string.");
        }
        
        if (!this._averagers.has(key)) {
            const effectiveAlpha = this._getEffectiveAlpha(alpha);
            // Use the internally defined static type reference
            const newAverager = new AveragingManager.#AveragerType(effectiveAlpha); 
            this._averagers.set(key, newAverager);
        }
        return this._averagers.get(key);
    }

    /**
     * Updates a specific metric with a new value.
     * Automatically creates the averager if necessary using the default alpha.
     * 
     * @param {string} key - The identifier for the metric.
     * @param {number} value - The new value for the average calculation.
     * @returns {number | null} The new calculated average, or null if the input value is invalid or processing fails.
     */
    update(key, value) {
        if (typeof value !== 'number' || isNaN(value)) {
            // Defensive return without error handling for robustness in data streams
            return this.getAverage(key); 
        }
        
        // Ensure key is valid before proceeding
        try {
            const averager = this.getAverager(key);
            return averager.update(value);
        } catch (e) {
            // Handle key validation error silently in update context, but log.
            // console.error(`AveragingManager update failed for key '${key}': ${e.message}`);
            return null;
        }
    }

    /**
     * Retrieves the current average for a specific metric key.
     * @param {string} key - The identifier for the metric.
     * @returns {number | null} The current average, or null if the key doesn't exist or hasn't initialized an average yet.
     */
    getAverage(key) {
        if (!key) return null;
        const averager = this._averagers.get(key);
        return averager?.average ?? null; // Use nullish coalescing for concise null return
    }

    /**
     * Retrieves all tracked metrics and their current averages.
     * @returns {Object.<string, number | null>} Map of metric keys to their current averages.
     */
    getAllAverages() {
        return Object.fromEntries(
            // Mapping iteration ensures no side effects and is highly performant.
            [...this._averagers.entries()].map(([key, averager]) => [key, averager.average])
        );
    }

    /**
     * Resets a single specific averager, or all averagers if no key is provided.
     * @param {string} [key] - Optional key to reset a specific averager.
     * @returns {boolean} True if reset occurred (or if full reset was requested), false if key was provided but not found.
     */
    reset(key) {
        if (key) {
            const averager = this._averagers.get(key);
            if (averager) {
                averager.reset();
                return true;
            }
            return false;
        } 
        
        // Full reset
        this._averagers.forEach(a => a.reset());
        return true;
    }

    /**
     * Removes an averager completely from the manager, freeing resources.
     * @param {string} key - The identifier for the metric to remove.
     * @returns {boolean} True if the averager was successfully removed, false otherwise.
     */
    removeAverager(key) {
        if (typeof key !== 'string' || key.trim() === '') return false;
        return this._averagers.delete(key);
    }
}

module.exports = AveragingManager;