// Implementation of MEE Metric Evaluation

/**
 * A utility function to apply normalization to calculated metric values.
 * Currently implements a simple 0-10 linear scale normalization for AGI capability scores.
 * @param {number} value - The raw calculated metric value.
 * @param {string} functionType - The requested normalization function type.
 * @returns {number} The normalized value.
 */
const normalize = (value, functionType) => {
  switch (functionType) {
    case 'SIGMOID_BOUNDED_10':
      // Simple sigmoid approximation scaled for 0-10 output for readability
      return parseFloat((10 / (1 + Math.exp(-(value / 5)))).toFixed(2));
    case 'LINEAR_0_10':
      // Assumes value is already somewhat bounded, caps it simply.
      return Math.max(0, Math.min(10, value));
    default:
      return value;
  }
};

class MetricEvaluationService {
  constructor(config) {
    this.config = config;
    this.metricDefinitions = config.metrics;
    this.contextMap = config.context_mapping;
    this.dataProvider = new Map(); 
  }

  async initializeDataProviders(providers) {
    // CRITICAL DIRECTIVE: Ensure Nexus memory integration for trend storage (Req #2)
    if (!providers || !providers.NEXUS) {
      throw new Error("MQM Service Initialization Error: NEXUS data provider is required for persistent memory integration.");
    }
    this.dataProvider = providers;
  }

  async storeMetricResult(metricId, calculatedValue) {
    const nexusProvider = this.dataProvider.get('NEXUS');
    if (nexusProvider && nexusProvider.storeTrend) {
      // Store the result trend to Nexus memory (Fulfills Integration Requirement #2)
      await nexusProvider.storeTrend({
        metricId: metricId,
        value: calculatedValue,
        timestamp: Date.now(),
        source: 'MQM'
      });
    }
  }

  /**
   * Calculates a single metric based on its definition and contributing data points.
   * Logs the result to Nexus memory (Requirement #2).
   * @param {string} metricId
   * @returns {Promise<{metricId: string, value: number|null, status: string, type?: string, normalized?: boolean}>}
   */
  async calculateMetric(metricId) {
    const definition = this.metricDefinitions[metricId];
    if (!definition) {
      console.warn(`Metric ID ${metricId} not defined.`);
      return { metricId, value: null, status: 'SKIPPED' };
    }
    
    let calculatedValue = 0;
    let successfulComponents = 0;

    for (const component of definition.calculation_components) {
      const providerKey = component.source_ref;
      const provider = this.dataProvider.get(providerKey);
      
      if (!provider || typeof provider.fetch !== 'function') {
        console.error(`Provider ${providerKey} missing or invalid for component: ${component.data_point}.`);
        continue;
      }
      
      try {
        const rawValue = await provider.fetch(component.data_point);
        
        if (typeof rawValue !== 'number') {
           console.warn(`Data point ${component.data_point} returned non-numeric value: ${rawValue}. Skipping component.`);
           continue; // Skip component if data is invalid
        }
        
        calculatedValue += rawValue * component.weight;
        successfulComponents++;
      } catch (e) {
        console.error(`Error fetching data point ${component.data_point} from ${providerKey}: ${e.message}`);
        // Continue processing other components for resilience
      }
    }
    
    if (successfulComponents === 0 && definition.calculation_components.length > 0) {
        // Metric calculation failed completely due to lack of data
        await this.storeMetricResult(metricId, null);
        return { metricId, value: null, status: 'FAILED_NO_DATA' };
    }

    // Apply normalization if defined (e.g., Sigmoid_Bounded)
    if (definition.normalization && definition.normalization.function) {
      calculatedValue = normalize(calculatedValue, definition.normalization.function);
    }
    
    // Check against risk thresholds for RISK metrics
    if (definition.type === 'RISK' && definition.thresholds && calculatedValue > definition.thresholds.static_max) {
      // Trigger alerts or mitigation logic (Future requirement)
      console.warn(`RISK METRIC ALERT: ${metricId} exceeded static max threshold.`);
    }

    // Log the result to Nexus memory immediately (Req #2)
    await this.storeMetricResult(metricId, calculatedValue);

    return { 
        metricId, 
        value: calculatedValue,
        status: 'SUCCESS',
        type: definition.type,
        normalized: !!definition.normalization
    };
  }

  /**
   * Calculates all defined metrics and returns a map of results.
   * This facilitates the core loop using MQM to measure improvement (Req #2).
   * @returns {Promise<Object<string, {value: number, status: string}>>}
   */
  async calculateAllMetrics() {
    const results = {};
    const metricIds = Object.keys(this.metricDefinitions);

    console.log(`Starting MQM evaluation across ${metricIds.length} metrics.`);

    for (const metricId of metricIds) {
      try {
        const result = await this.calculateMetric(metricId);
        results[metricId] = result;
      } catch (e) {
        console.error(`Critical error during calculation of metric ${metricId}: ${e.message}`);
        results[metricId] = { metricId, value: null, status: 'CRITICAL_ERROR' };
      }
    }
    return results;
  }
}