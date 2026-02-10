// Implementation of MEE Metric Evaluation

/**
 * A utility function to apply normalization to calculated metric values.
 * Currently implements a simple 0-10 linear scale normalization for AGI capability scores.
 * @param {number} value - The raw calculated metric value.
 * @param {string} functionType - The requested normalization function type.
 * @returns {number} The normalized value.
 */
const normalize = (value: number, functionType: string): number => {
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

// Define necessary interfaces for clean TypeScript integration
interface ComponentDefinition {
    source_ref: string;
    data_point: string;
    weight: number;
}

interface MetricDefinition {
    calculation_components: ComponentDefinition[];
    normalization?: { function: string };
    type: string;
    thresholds?: { static_max: number };
}

interface Config {
    metrics: Record<string, MetricDefinition>;
    context_mapping: any;
}

interface DataProvider {
    fetch: (dataPoint: string) => Promise<number>;
    storeTrend?: (data: any) => Promise<void>;
}

interface CalculationResult {
    calculatedValue: number;
    successfulComponents: number;
    totalComponents: number;
}

interface AsyncWeightedScorerInterface {
    calculate(components: ComponentDefinition[], dataProviderMap: Map<string, DataProvider>): Promise<CalculationResult>;
}

class MetricEvaluationService {
  private config: Config;
  private metricDefinitions: Record<string, MetricDefinition>;
  private contextMap: any;
  private dataProvider: Map<string, DataProvider>;
  // Assumed injection point for the new plugin
  private asyncWeightedScorer: AsyncWeightedScorerInterface; 

  constructor(config: Config) {
    this.config = config;
    this.metricDefinitions = config.metrics;
    this.contextMap = config.context_mapping;
    this.dataProvider = new Map<string, DataProvider>(); 
    
    // Initialize the plugin interface placeholder (runtime kernel will inject implementation)
    this.asyncWeightedScorer = {} as AsyncWeightedScorerInterface; 
  }

  async initializeDataProviders(providers: Record<string, DataProvider>) {
    // CRITICAL DIRECTIVE: Ensure Nexus memory integration for trend storage (Req #2)
    if (!providers || !providers.NEXUS) {
      throw new Error("MQM Service Initialization Error: NEXUS data provider is required for persistent memory integration.");
    }
    // Convert object input to Map for internal consistency
    this.dataProvider = new Map(Object.entries(providers));
  }

  async storeMetricResult(metricId: string, calculatedValue: number | null) {
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
  async calculateMetric(metricId: string): Promise<{metricId: string, value: number|null, status: string, type?: string, normalized?: boolean}> {
    const definition = this.metricDefinitions[metricId];
    if (!definition) {
      console.warn(`Metric ID ${metricId} not defined.`);
      return { metricId, value: null, status: 'SKIPPED' };
    }
    
    // 1. Use the AsyncWeightedScorer plugin to perform data fetching and aggregation.
    if (typeof this.asyncWeightedScorer.calculate !== 'function') {
        console.error(`AsyncWeightedScorer not available. Falling back to internal calculation (not implemented).`);
        // We rely on the plugin for complex logic now. Fail cleanly if not present.
        return { metricId, value: null, status: 'CRITICAL_ERROR' };
    }

    const { calculatedValue: rawValue, successfulComponents, totalComponents } = 
        await this.asyncWeightedScorer.calculate(
            definition.calculation_components, 
            this.dataProvider
        );

    let calculatedValue = rawValue;

    if (successfulComponents === 0 && totalComponents > 0) {
        // Metric calculation failed completely due to lack of data
        await this.storeMetricResult(metricId, null);
        return { metricId, value: null, status: 'FAILED_NO_DATA' };
    }

    // 2. Apply normalization if defined 
    if (definition.normalization && definition.normalization.function) {
      calculatedValue = normalize(calculatedValue, definition.normalization.function);
    }
    
    // 3. Check against risk thresholds for RISK metrics
    if (definition.type === 'RISK' && definition.thresholds && calculatedValue > definition.thresholds.static_max) {
      // Trigger alerts or mitigation logic (Future requirement)
      console.warn(`RISK METRIC ALERT: ${metricId} exceeded static max threshold.`);
    }

    // 4. Log the result to Nexus memory immediately (Req #2)
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
  async calculateAllMetrics(): Promise<Record<string, {value: number|null, status: string}>> {
    const results: Record<string, {value: number|null, status: string}> = {};
    const metricIds = Object.keys(this.metricDefinitions);

    console.log(`Starting MQM evaluation across ${metricIds.length} metrics.`);

    for (const metricId of metricIds) {
      try {
        const result = await this.calculateMetric(metricId);
        results[metricId] = result;
      } catch (e) {
        console.error(`Critical error during calculation of metric ${metricId}: ${(e as Error).message}`);
        results[metricId] = { metricId, value: null, status: 'CRITICAL_ERROR' };
      }
    }
    return results;
  }
}