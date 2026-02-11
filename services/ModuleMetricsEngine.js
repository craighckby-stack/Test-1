/**
 * ModuleMetricPayloadFormatter (Simulated Plugin Dependency)
 * Assumed to be injected via config.
 *
 * Interface: { format: (rawMetrics: { dependencies: any, complexityScore: number }) => StandardizedMetrics }
 */

/**
 * MetricAnalysisExecutor (New Plugin Dependency)
 * Interface: { execute: (sourceCode: string, lang: string) => Promise<{dependencies: any, complexityScore: number}> }
 */

/**
 * ModuleMetricsEngine
 * Central service responsible for calculating static metrics (complexity, dependencies)
 * based on source code analysis to populate module interface metadata.
 */
class ModuleMetricsEngine {
  /**
   * @param {object} config
   * @param {object} config.analysisExecutor - Service for executing static analysis jobs (the new plugin).
   * @param {object} config.metricFormatter - The ModuleMetricPayloadFormatter utility for standardizing output structure.
   */
  constructor(config) {
    if (!config.analysisExecutor || !config.metricFormatter) {
      throw new Error("ModuleMetricsEngine requires analysisExecutor and metricFormatter in configuration.");
    }
    this.analysisExecutor = config.analysisExecutor;
    this.metricFormatter = config.metricFormatter;
  }

  /**
   * Analyzes source code to derive standardized metrics.
   * @param {string} sourceCode
   * @param {string} [lang='javascript']
   * @returns {Promise<object>} Standardized module metrics payload.
   */
  async analyze(sourceCode, lang = 'javascript') {
    // 1. Calculate raw metrics using the dedicated executor (runs analyzers in parallel)
    const rawMetrics = await this.analysisExecutor.execute(sourceCode, lang);

    // 2. Format and standardize the payload
    return this.metricFormatter.format(rawMetrics);
  }

  // Methods for storing/retrieving historical scores...
}

module.exports = ModuleMetricsEngine;
