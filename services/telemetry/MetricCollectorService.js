// Note: This implementation assumes MetricNormalizationUtility is available via injection or global scope.

/**
 * @typedef {object} TelemetryAdapter
 * @property {function} report - Method to report normalized metrics externally.
 */

// Class responsible for standardizing metric ingestion and normalization.
class MetricCollectorService {
  /**
   * @param {TelemetryAdapter} telemetryAdapter
   * @param {object} MetricNormalizationUtility - Injected utility for metric processing.
   */
  constructor(telemetryAdapter, MetricNormalizationUtility) {
    this.adapter = telemetryAdapter;
    this.metricCache = {};
    this.normalizationTool = MetricNormalizationUtility; 
    
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
    if (!this.normalizationTool || typeof this.normalizationTool.execute !== 'function') {
        throw new Error("Normalization Utility is not available or correctly initialized.");
    }
    
    // Delegation to the extracted tool for validation and normalization.
    const normalizedMetrics = this.normalizationTool.execute({
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