// Note: This implementation assumes MetricNormalizationUtility is available via injection or global scope.

/**
 * @typedef {object} TelemetryAdapter
 * @property {function} report - Method to report normalized metrics externally.
 */

/**
 * @typedef {object} MetricNormalizerInterface
 * @property {function({rawData: object, mappingConfig: object, sourceIdentifier: string}): object} execute - Method to perform metric transformation and standardization.
 */

// Class responsible for standardizing metric ingestion, normalization, and caching.
class MetricCollectorService {
  /**
   * @param {TelemetryAdapter} telemetryAdapter
   * @param {MetricNormalizerInterface} metricNormalizer - Injected utility conforming to the MetricNormalizer interface.
   */
  constructor(telemetryAdapter, metricNormalizer) {
    this.adapter = telemetryAdapter;
    this.metricCache = {};
    this.normalizer = metricNormalizer; 
    
    // TQM Mapping configuration definition (should ideally be loaded from configuration service)
    this.tqmMappingConfig = {
        'SonarQube.CC': 'code.cyclomatic_complexity',
        'Jira.OpenBugs': 'process.open_critical_defects',
        'Coverage.Line': 'quality.test_coverage_line',
        // Add more mappings
    };
  }

  // Ingests raw data, validates structure, and normalized metric keys based on TQM mapping.
  async ingestAndNormalizeMetrics(rawData, sourceIdentifier) {
    if (!this.normalizer || typeof this.normalizer.execute !== 'function') {
        throw new Error("Metric Normalizer is not available or correctly initialized.");
    }
    
    // Delegation to the extracted normalization tool.
    const normalizedMetrics = this.normalizer.execute({
        rawData: rawData,
        mappingConfig: this.tqmMappingConfig,
        sourceIdentifier: sourceIdentifier
    });
    
    Object.assign(this.metricCache, normalizedMetrics);
    
    // Optional: Use adapter to report normalized data
    if (this.adapter && typeof this.adapter.report === 'function') {
        this.adapter.report(normalizedMetrics, sourceIdentifier);
    }
    
    return normalizedMetrics;
  }

  getMetricValue(metricKey) {
    return this.metricCache[metricKey] || null;
  }

  // Method exposed to TQM Policy Engine for policy evaluation.
  getMetricsForPolicyEvaluation(policyKeys) {
    return policyKeys.reduce((acc, key) => {
      acc[key] = this.getMetricValue(key);
      return acc;
    }, {});
  }
}

module.exports = MetricCollectorService;