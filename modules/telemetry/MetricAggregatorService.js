/**
 * MetricAggregatorService.js
 * Handles the intake of raw, disparate telemetry streams (e.g., Prometheus metrics, API health checks),
 * performs necessary unit conversion, normalization, sampling rate consolidation, and outputs
 * a single, consistent 'ProcessedMetric' object intended for the PhaseEvaluatorEngine.
 */
const EventEmitter = require('events');

/**
 * MetricDataStandardizer instance (assuming injection or accessible global)
 * @typedef {object} MetricDataStandardizerInstance
 * @property {function(object): object} standardize - Function to coerce and standardize raw data.
 */

/**
 * PeriodicRunner instance (injected plugin)
 * @typedef {object} PeriodicRunnerInstance
 * @property {function(): void} start
 * @property {function(): void} stop
 */

class MetricAggregatorService extends EventEmitter {
    /**
     * @param {object} config - Configuration defining metric sources, sampling intervals, and normalization rules.
     * @param {function} logger - Logging utility.
     * @param {MetricDataStandardizerInstance} [metricStandardizer] - Tool for data normalization.
     * @param {function} [PeriodicRunnerClass] - Class used to manage scheduled metric pushes (from plugin).
     */
    constructor(config, logger = console, metricStandardizer = null, PeriodicRunnerClass = null) {
        super();
        this.config = config;
        this.logger = logger;
        this.aggregatedMetrics = {};
        this.sources = this._initializeSources(config.sources);
        
        // Dependency Injection for the standardization tool
        this.metricStandardizer = metricStandardizer;

        // Initialize the timing mechanism using the abstracted runner
        const pushIntervalMs = config.pushIntervalMs || 5000;
        
        if (PeriodicRunnerClass) {
            // Instantiate the runner, binding pushMetrics as the periodic callback
            this.runner = new PeriodicRunnerClass(pushIntervalMs, this.pushMetrics.bind(this), this.logger);
        } else {
            this.logger.warn('PeriodicRunnerClass not provided. Periodic push functionality is unavailable.');
            // Fallback: implement Null Object pattern for safety
            this.runner = { start: () => { this.logger.warn('Cannot start aggregation: PeriodicRunner missing.'); }, stop: () => {} };
        }
    }

    _initializeSources(sourceConfigs) {
        // Placeholder: In a real implementation, this sets up connections
        this.logger.info(`Initialized aggregator with ${sourceConfigs.length} metric sources.`);
        return sourceConfigs;
    }

    /**
     * Standardizes and validates incoming raw metric data based on configuration rules.
     * @param {string} sourceName
     * @param {object} rawData
     */
    ingestRawData(sourceName, rawData) {
        const normalized = this._normalize(sourceName, rawData);
        Object.assign(this.aggregatedMetrics, normalized);
    }

    /**
     * Applies unit conversion, filtering, and required aggregation/smoothing using the external tool.
     * @param {string} source
     * @param {object} data
     * @returns {object} Clean, numerical metrics.
     */
    _normalize(source, data) {
        if (this.metricStandardizer && typeof this.metricStandardizer.standardize === 'function') {
            // Use the injected external tool
            return this.metricStandardizer.standardize(data, this.config.normalizationRules);
        }

        // Fallback implementation matching the original stub if no tool is provided
        this.logger.warn('MetricDataStandardizer not provided. Using basic parseFloat fallback.');
        const processed = {};
        for (const key in data) {
            processed[key] = parseFloat(data[key]);
        }
        return processed;
    }

    /**
     * Starts the periodic push mechanism using the PeriodicRunner.
     */
    start() {
        this.runner.start();
        this.logger.info(`Metric Aggregator requested start via runner.`);
    }

    /**
     * Stops the periodic push mechanism using the PeriodicRunner.
     */
    stop() {
        this.runner.stop();
    }

    /**
     * Pushes the latest aggregated metrics for phase evaluation.
     * @event metricsAggregated
     */
    pushMetrics() {
        // Ensure we send a copy to prevent mutation issues downstream
        this.emit('metricsAggregated', {...this.aggregatedMetrics, timestamp: Date.now()});
    }
}

module.exports = MetricAggregatorService;