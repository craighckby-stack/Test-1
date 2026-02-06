// Sovereign AGI Metric Engine Collector (v94.1) - Refactored
// Responsible for dynamic metric sourcing and calculation execution via Strategy Pattern.

/**
 * MetricEngineCollector
 * Uses dependency injection and a handler strategy map to execute various metric calculation methods.
 */
class MetricEngineCollector {
    /**
     * @param {object} dependencies - Dependencies object
     * @param {object} dependencies.repository - Metric definition repository.
     * @param {object} dependencies.handlers - Map of calculation methods to execution services (e.g., { 'EXTERNAL_API': ApiMetricHandler })
     */
    constructor({ repository, handlers }) {
        if (!repository || !handlers) {
            throw new Error("MetricEngineCollector initialization requires repository and handlers map.");
        }
        this.repository = repository;
        this.handlers = handlers; // Strategy map
        // Note: Handlers are expected to conform to the .execute(template) interface.
    }

    /**
     * Collects and calculates a specific metric based on its configuration template.
     * @param {string} metricId - The ID of the metric to collect.
     * @returns {Promise<object|null>} The calculated metric data or structured failure status.
     */
    async collectMetric(metricId) {
        const template = this.repository.metrics[metricId];

        if (!template) {
            console.warn(`[MetricEngine] Metric ID ${metricId} not found in repository.`);
            return null;
        }
        if (template.status !== 'ACTIVE') {
            console.debug(`[MetricEngine] Metric ID ${metricId} is inactive.`);
            return null;
        }

        const method = template.calculation_method;
        const handler = this.handlers[method];

        if (!handler) {
            throw new Error(`Metric ID ${metricId}: Unsupported or unconfigured calculation method handler: ${method}`);
        }

        try {
            console.log(`[MetricEngine] Executing metric ${metricId} via method: ${method}`);
            
            // Execute the strategy handler
            const result = await handler.execute(template);
            
            // TODO: Integrate common validation and threshold checks here (Post-processing pipeline)
            
            return {
                metricId,
                timestamp: Date.now(),
                value: result
            };
        } catch (error) {
            console.error(`[MetricEngine] Failure collecting metric ${metricId} (Method: ${method}):`, error.stack);
            // Record failure for system health monitoring
            return {
                metricId,
                status: 'FAILED',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // Existing validation and threshold logic will now be integrated 
    // either into a post-processing step or handled within specific Handlers.
}

module.exports = MetricEngineCollector;
