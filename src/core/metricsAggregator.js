/**
 * MetricsAggregator
 * Efficiently aggregates time-series data (counts, sums, min/max) and dispatches them
 * using a dependency-injected plugin.
 */
class MetricsAggregator {
    /**
     * @param {MetricsDispatcher} dispatcherPlugin - The plugin responsible for sending aggregated data.
     * @param {number} [intervalMs=60000] - The interval (in milliseconds) for dispatching metrics.
     */
    constructor(dispatcherPlugin, intervalMs = 60000) {
        if (!dispatcherPlugin || typeof dispatcherPlugin.dispatch !== 'function') {
            throw new Error("MetricsAggregator requires a valid MetricsDispatcher plugin with a 'dispatch' method.");
        }
        this.dispatcher = dispatcherPlugin;
        this.metrics = new Map();
        this.intervalMs = intervalMs;
        this.timer = null;
        this.startTime = Date.now();
    }

    /**
     * Records a single occurrence of a metric.
     * @param {string} name - The name of the metric (e.g., 'task_latency').
     * @param {number} value - The numerical value of the observation.
     * @param {Object} [tags={}] - Optional tags for dimensioning the metric.
     */
    recordMetric(name, value, tags = {}) {
        if (typeof value !== 'number') return;

        if (!this.metrics.has(name)) {
            this.metrics.set(name, { count: 0, sum: 0, min: Infinity, max: -Infinity, tags: tags });
        }
        const data = this.metrics.get(name);
        
        // Update aggregation statistics
        data.count += 1;
        data.sum += value;
        data.min = Math.min(data.min, value);
        data.max = Math.max(data.max, value);
    }

    /**
     * Aggregates current recorded data, resets internal state, and returns the payload.
     * @returns {Array<Object>} The aggregated metrics payload.
     */
    aggregate() {
        const payload = [];
        const endTime = Date.now();
        const duration = endTime - this.startTime;

        for (const [name, data] of this.metrics.entries()) {
            const avg = data.count > 0 ? data.sum / data.count : 0;
            payload.push({
                name: name,
                timestamp: endTime,
                intervalMs: duration,
                count: data.count,
                sum: data.sum,
                min: data.min === Infinity ? 0 : data.min,
                max: data.max === -Infinity ? 0 : data.max,
                average: avg,
                tags: data.tags
            });
        }
        
        // Reset state for the next interval
        this.metrics.clear();
        this.startTime = endTime;

        return payload;
    }

    /**
     * Executes aggregation and dispatches the data using the injected plugin.
     */
    async dispatchMetrics() {
        const payload = this.aggregate();
        if (payload.length > 0) {
            try {
                await this.dispatcher.dispatch(payload);
            } catch (err) {
                // Use a dedicated error logging mechanism if available
                console.error("Metrics dispatcher failed:", err);
            }
        }
    }

    /**
     * Starts the timed aggregation and dispatch cycle.
     */
    start() {
        if (this.timer) {
            this.stop();
        }
        this.timer = setInterval(() => {
            this.dispatchMetrics();
        }, this.intervalMs);
        console.log(`MetricsAggregator started, dispatching every ${this.intervalMs}ms.`);
    }

    /**
     * Stops the timed aggregation cycle.
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log("MetricsAggregator stopped.");
            // Dispatch any remaining metrics upon stop
            this.dispatchMetrics(); 
        }
    }
}