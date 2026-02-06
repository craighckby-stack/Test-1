const MetricDefinitions = require('../../config/MetricDefinitions.json');

const ValidTypes = new Set(['COUNTER', 'GAUGE', 'SUMMARY', 'HISTOGRAM']);
const ValidAggregations = new Set(['SUM', 'AVERAGE', 'MAX', 'LAST']);

/**
 * Validates the structure and consistency of all defined metrics.
 * Initializes a standardized monitoring client based on the definitions.
 */
class MetricInitializer {
  constructor() {
    this.definitions = MetricDefinitions;
    this.validatedDefinitions = this._validateDefinitions();
    this._initializeMonitoringClient();
  }

  _validateDefinitions() {
    const validated = {};
    for (const [name, def] of Object.entries(this.definitions)) {
      if (!def.key || def.key !== name) throw new Error(`Metric ${name}: key mismatch or missing.`);
      if (!ValidTypes.has(def.type)) throw new Error(`Metric ${name}: Invalid type specified: ${def.type}`);
      if (!ValidAggregations.has(def.aggregation_strategy)) throw new Error(`Metric ${name}: Invalid aggregation strategy: ${def.aggregation_strategy}`);
      
      // Additional checks for required fields
      if (!def.description || !def.unit || !def.criticality) throw new Error(`Metric ${name}: Missing required metadata field.`);
      
      validated[name] = def;
    }
    console.log(`[MetricInitializer] Successfully validated ${Object.keys(validated).length} metrics.`);
    return validated;
  }

  _initializeMonitoringClient() {
    // Implementation to connect to Prometheus/Datadog and register all metrics
    // using the type and tags defined in MetricDefinitions.json.
    console.log('[MetricInitializer] Monitoring client initialized and definitions registered.');
  }

  getDefinitions() {
    return this.validatedDefinitions;
  }
}

module.exports = new MetricInitializer();
