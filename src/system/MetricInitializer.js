const MetricDefinitions = require('../../config/MetricDefinitions.json');
const TelemetryAdapter = require('./telemetry/TelemetryAdapter');

/**
 * Standardized constants for metric definition validation.
 */
const MetricConstraints = {
  VALID_TYPES: new Set(['COUNTER', 'GAUGE', 'SUMMARY', 'HISTOGRAM']),
  VALID_AGGREGATIONS: new Set(['SUM', 'AVERAGE', 'MAX', 'LAST', 'NONE']),
  REQUIRED_FIELDS: ['description', 'unit', 'criticality', 'tags']
};

/**
 * Loads, validates, and registers all defined system metrics with the Telemetry Adapter.
 * This class ensures definition integrity before the system starts producing metrics.
 */
class MetricInitializer {
  /**
   * @param {Object} definitions - Configuration loaded from MetricDefinitions.json.
   * @param {Object} adapter - The TelemetryAdapter instance/class.
   */
  constructor(definitions, adapter) {
    this.definitions = definitions;
    this.telemetryAdapter = adapter;
    this.validatedDefinitions = this._validateDefinitions(this.definitions);
    this._registerMetrics();
  }

  /**
   * Performs deep validation on the metric definitions structure.
   * @throws {Error} If any metric fails constraints.
   * @returns {Object} The validated definition subset.
   */
  _validateDefinitions(defs) {
    const validated = {};
    const { VALID_TYPES, VALID_AGGREGATIONS, REQUIRED_FIELDS } = MetricConstraints;

    for (const [name, def] of Object.entries(defs)) {
      if (!def || typeof def !== 'object') {
        throw new Error(`Metric ${name}: Definition must be a valid object.`);
      }

      // Type Check
      if (!def.type || !VALID_TYPES.has(def.type)) {
        throw new Error(`Metric ${name}: Invalid or missing type '${def.type}'. Must be one of: ${[...VALID_TYPES].join(', ')}`);
      }

      // Aggregation Strategy Check
      if (!def.aggregation_strategy || !VALID_AGGREGATIONS.has(def.aggregation_strategy)) {
        throw new Error(`Metric ${name}: Invalid or missing aggregation strategy '${def.aggregation_strategy}'. Must be one of: ${[...VALID_AGGREGATIONS].join(', ')}`);
      }

      // Required Metadata Check
      for (const field of REQUIRED_FIELDS) {
        if (!def[field]) {
          throw new Error(`Metric ${name}: Missing required metadata field: ${field}.`);
        }
      }

      // Ensure tags are a valid structure (array of strings)
      if (def.tags && (!Array.isArray(def.tags) || def.tags.some(t => typeof t !== 'string'))) {
         throw new Error(`Metric ${name}: Tags must be an array of strings.`);
      }

      validated[name] = def;
    }

    console.log(`[MetricInitializer] Successfully validated ${Object.keys(validated).length} metric definitions.`);
    return validated;
  }

  /**
   * Passes validated metrics to the underlying telemetry system for registration.
   */
  _registerMetrics() {
    this.telemetryAdapter.registerDefinitions(this.validatedDefinitions);
    console.log('[MetricInitializer] Metrics successfully registered with Telemetry Adapter.');
  }

  getDefinitions() {
    return this.validatedDefinitions;
  }
}

// Instantiate and export the singleton using the abstracted adapter
module.exports = new MetricInitializer(MetricDefinitions, TelemetryAdapter);