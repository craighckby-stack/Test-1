const MetricDefinitions = require('../../config/MetricDefinitions.json');
const TelemetryAdapter = require('./telemetry/TelemetryAdapter');

/**
 * Loads, validates, and registers all defined system metrics with the Telemetry Adapter.
 * This class ensures definition integrity before the system starts producing metrics.
 */
class MetricInitializer {

  /**
   * Standardized constraints for metric definition validation.
   * Using static properties improves encapsulation and readiness for testing.
   */
  static CONSTRAINTS = {
    VALID_TYPES: new Set(['COUNTER', 'GAUGE', 'SUMMARY', 'HISTOGRAM']),
    VALID_AGGREGATIONS: new Set(['SUM', 'AVERAGE', 'MAX', 'LAST', 'NONE']),
    REQUIRED_FIELDS: ['description', 'unit', 'criticality', 'tags']
  };

  /**
   * Performs deep validation on the metric definitions structure.
   * This is implemented as a static method as validation logic is independent of the instance state.
   * @param {Object} defs - Configuration loaded from MetricDefinitions.json.
   * @returns {Object} The validated definition subset.
   * @throws {Error} If any metric fails constraints.
   */
  static validateDefinitions(defs) {
    const validated = {};
    const { VALID_TYPES, VALID_AGGREGATIONS, REQUIRED_FIELDS } = MetricInitializer.CONSTRAINTS;

    if (typeof defs !== 'object' || defs === null) {
      throw new Error('MetricDefinitions must be a valid object structure.');
    }

    for (const [name, def] of Object.entries(defs)) {
      if (!def || typeof def !== 'object') {
        throw new Error(`Metric Validation Failure (${name}): Definition must be a valid object.`);
      }

      // 1. Required Field Check
      for (const field of REQUIRED_FIELDS) {
        if (!def[field] && def[field] !== 0) { // Allow zero value if necessary, though unlikely for string fields
          throw new Error(`Metric Validation Failure (${name}): Missing or empty required metadata field: ${field}.`);
        }
      }

      // 2. Type Check
      if (!def.type || !VALID_TYPES.has(def.type)) {
        throw new Error(`Metric Validation Failure (${name}): Invalid type '${def.type}'. Must be one of: ${[...VALID_TYPES].join(', ')}`);
      }

      // 3. Aggregation Strategy Check
      if (!def.aggregation_strategy || !VALID_AGGREGATIONS.has(def.aggregation_strategy)) {
        throw new Error(`Metric Validation Failure (${name}): Invalid aggregation strategy '${def.aggregation_strategy}'. Must be one of: ${[...VALID_AGGREGATIONS].join(', ')}`);
      }

      // 4. Tags Structure Check
      if (!Array.isArray(def.tags) || def.tags.some(t => typeof t !== 'string' || t.trim() === '')) {
         throw new Error(`Metric Validation Failure (${name}): Tags must be a non-empty array of non-empty strings.`);
      }

      validated[name] = def;
    }

    console.log(`[MetricInitializer] Successfully validated ${Object.keys(validated).length} metric definitions.`);
    return validated;
  }

  /**
   * @param {Object} definitions - Configuration loaded from MetricDefinitions.json.
   * @param {Object} adapter - The TelemetryAdapter instance/class.
   */
  constructor(definitions, adapter) {
    if (!adapter || typeof adapter.registerDefinitions !== 'function') {
      throw new Error('MetricInitializer: Invalid TelemetryAdapter provided. Must implement registerDefinitions().');
    }

    this.telemetryAdapter = adapter;
    
    // Use static method for validation
    this.validatedDefinitions = MetricInitializer.validateDefinitions(definitions);
    
    this._registerMetrics();
  }

  /**
   * Passes validated metrics to the underlying telemetry system for registration.
   */
  _registerMetrics() {
    this.telemetryAdapter.registerDefinitions(this.validatedDefinitions);
    console.log('[MetricInitializer] Metrics successfully registered with Telemetry Adapter.');
  }

  /**
   * Retrieves the validated and registered definitions.
   * @returns {Object}
   */
  getDefinitions() {
    return this.validatedDefinitions;
  }
}

// Instantiate and export the singleton using the abstracted adapter
module.exports = new MetricInitializer(MetricDefinitions, TelemetryAdapter);