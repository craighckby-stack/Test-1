/**
 * ExternalApiMetricHandler
 * Specific handler implementation for fetching metrics via external REST APIs.
 * Implements the required execute(template) interface for MetricEngineCollector.
 */
class ExternalApiMetricHandler {
    /**
     * @param {object} fetchUtility - An instance implementing the ConfigurableFetchUtility interface (must have an 'execute' method).
     */
    constructor(fetchUtility) {
        if (!fetchUtility || typeof fetchUtility.execute !== 'function') {
            throw new Error("ExternalApiMetricHandler requires a valid fetch utility with an 'execute' method.");
        }
        this.fetchUtility = fetchUtility;
    }

    /**
     * Executes the metric collection based on the template source configuration.
     * It delegates the API call to the injected fetch utility.
     * @param {object} template - The metric definition template containing source_config.
     * @returns {Promise<any>} The raw value returned by the external API.
     */
    async execute(template) {
        if (!template || !template.source_config) {
            throw new Error("API Metric handler requires 'source_config' in the template.");
        }
        
        // Use the standardized utility to execute the configured fetch request
        return this.fetchUtility.execute(template.source_config);
    }
}

module.exports = ExternalApiMetricHandler;