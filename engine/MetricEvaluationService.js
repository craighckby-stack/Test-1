/**
 * AGI-KERNEL v7.11.3
 * Component: Metric Evaluation Service (MEE)
 */

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

/**
 * Abstracted reusable logic for metric value transformation (scaling, bounding).
 */
interface NormalizationUtilityInterface {
    normalize(value: number, functionType: string): number;
}

class MetricEvaluationService {
  #config: Config;
  #metricDefinitions: Record<string, MetricDefinition>;
  #contextMap: any;
  #dataProvider: Map<string, DataProvider>;
  // Assumed injection point for the plugin managing data aggregation
  #asyncWeightedScorer: AsyncWeightedScorerInterface;
  // Assumed injection point for the plugin managing value scaling
  #normalizationUtility: NormalizationUtilityInterface;

  constructor(config: Config) {
    this.#initializeEngine(config);
  }

  /**
   * Extracts synchronous configuration loading and initial state setup.
   */
  #initializeEngine(config: Config) {
    this.#config = config;
    this.#metricDefinitions = config.metrics;
    this.#contextMap = config.context_mapping;
    this.#dataProvider = new Map<string, DataProvider>();

    // Initialize the plugin interface placeholders (runtime kernel will inject implementation)
    this.#asyncWeightedScorer = {} as AsyncWeightedScorerInterface;
    this.#normalizationUtility = {} as NormalizationUtilityInterface;
  }

  // --- I/O Proxy and Validation Methods ---

  /**
   * Enforces nexus dependency and sets the internal data provider map (Synchronous Setup).
   */
  #validateAndSetDataProviders(providers: Record<string, DataProvider>) {
    if (!providers || !providers.NEXUS) {
      throw new Error("MQM Service Initialization Error: NEXUS data provider is required for persistent memory integration.");
    }
    // Convert object input to Map for internal consistency
    this.#dataProvider = new Map(Object.entries(providers));
  }

  /**
   * Delegates the asynchronous storage of the metric trend to the NEXUS provider (I/O Proxy).
   */
  async #delegateToNexusStorage(metricId: string, calculatedValue: number | null): Promise<void> {
    const nexusProvider = this.#dataProvider.get('NEXUS');
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
   * Delegates calculation to the external Async Weighted Scorer tool (Plugin I/O Proxy).
   */
  async #delegateToWeightedScorer(components: ComponentDefinition[], dataProviderMap: Map<string, DataProvider>): Promise<CalculationResult> {
    if (typeof this.#asyncWeightedScorer.calculate !== 'function') {
        throw new Error("AsyncWeightedScorer dependency is not injected or initialized.");
    }
    return this.#asyncWeightedScorer.calculate(components, dataProviderMap);
  }

  /**
   * Delegates value transformation (normalization) to the external utility (Plugin I/O Proxy).
   */
  #delegateToNormalizationUtility(value: number, functionType: string): number {
    if (typeof this.#normalizationUtility.normalize !== 'function') {
        console.error(`Normalization function '${functionType}' requested, but NormalizationUtility dependency is not injected.`);
        return value; // Proceed with raw value
    }
    return this.#normalizationUtility.normalize(value, functionType);
  }

  // --- Public API ---

  async initializeDataProviders(providers: Record<string, DataProvider>) {
    this.#validateAndSetDataProviders(providers);
  }

  async storeMetricResult(metricId: string, calculatedValue: number | null) {
    return this.#delegateToNexusStorage(metricId, calculatedValue);
  }

  /**
   * Calculates a single metric based on its definition and contributing data points.
   * Logs the result to Nexus memory (Requirement #2).
   * @param {string} metricId
   * @returns {Promise<{metricId: string, value: number|null, status: string, type?: string, normalized?: boolean}>}
   */
  async calculateMetric(metricId: string): Promise<{metricId: string, value: number|null, status: string, type?: string, normalized?: boolean}> {
    const definition = this.#metricDefinitions[metricId];
    if (!definition) {
      console.warn(`Metric ID ${metricId} not defined.`);
      return { metricId, value: null, status: 'SKIPPED' };
    }

    let rawValue: number;
    let successfulComponents: number;
    let totalComponents: number;
    let calculatedValue: number;
    let isNormalized = false;

    // 1. Use the AsyncWeightedScorer plugin proxy to perform data fetching and aggregation.
    try {
        const result = await this.#delegateToWeightedScorer(
            definition.calculation_components,
            this.#dataProvider
        );
        rawValue = result.calculatedValue;
        successfulComponents = result.successfulComponents;
        totalComponents = result.totalComponents;
        calculatedValue = rawValue;

    } catch (e) {
        if (e instanceof Error && e.message.includes("AsyncWeightedScorer dependency")) {
            console.error(e.message);
            return { metricId, value: null, status: 'CRITICAL_ERROR' };
        }
        throw e;
    }

    if (successfulComponents === 0 && totalComponents > 0) {
        // Metric calculation failed completely due to lack of data
        await this.#delegateToNexusStorage(metricId, null);
        return { metricId, value: null, status: 'FAILED_NO_DATA' };
    }

    // 2. Apply normalization if defined
    if (definition.normalization && definition.normalization.function) {
      calculatedValue = this.#delegateToNormalizationUtility(calculatedValue, definition.normalization.function);
      isNormalized = true;
    }

    // 3. Check against risk thresholds for RISK metrics
    if (definition.type === 'RISK' && definition.thresholds && calculatedValue > definition.thresholds.static_max) {
      // Trigger alerts or mitigation logic (Future requirement)
      console.warn(`RISK METRIC ALERT: ${metricId} exceeded static max threshold.`);
    }

    // 4. Log the result to Nexus memory immediately (Req #2)
    await this.#delegateToNexusStorage(metricId, calculatedValue);

    return {
        metricId,
        value: calculatedValue,
        status: 'SUCCESS',
        type: definition.type,
        normalized: isNormalized
    };
  }

  /**
   * Calculates all defined metrics and returns a map of results.
   * This facilitates the core loop using MQM to measure improvement (Req #2).
   * @returns {Promise<Object<string, {value: number, status: string}>>}
   */
  async calculateAllMetrics(): Promise<Record<string, {value: number|null, status: string}>> {
    const results: Record<string, {value: number|null, status: string}> = {};
    const metricIds = Object.keys(this.#metricDefinitions);

    console.log(`Starting MQM evaluation across ${metricIds.length} metrics.`);

    for (const metricId of metricIds) {
      try {
        const result = await this.calculateMetric(metricId);
        results[metricId] = result;
      } catch (e) {
        console.error(`Critical error during calculation of metric ${metricId}: ${(e as Error).message}`);
        results[metricId] = { value: null, status: 'CRITICAL_ERROR' };
      }
    }
    return results;
  }
}
