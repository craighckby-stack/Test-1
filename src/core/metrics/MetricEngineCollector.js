// Sovereign AGI Metric Engine Collector (v94.2) - Refactored
// Responsible for dynamic metric sourcing and calculation execution via Strategy Pattern, 
// now integrating dedicated logging, post-processing services, and dedicated template validation.

/**
 * MetricEngineCollector
 * Uses dependency injection and a handler strategy map to execute various metric calculation methods.
 */
class MetricEngineCollector {
    /**
     * @param {object} dependencies - Dependencies object
     * @param {object} dependencies.repository - Metric definition repository.
     * @param {object} dependencies.handlers - Map of calculation methods to execution services.
     * @param {object} dependencies.logger - Standardized system logger.
     * @param {object} dependencies.postProcessor - Service for validation, transformation, and threshold checks.
     * @param {object} dependencies.templateValidator - Extracted tool for validating metric templates and handlers.
     */
    constructor({ repository, handlers, logger, postProcessor, templateValidator }) {
        if (!repository || !handlers || !logger || !postProcessor || !templateValidator) {
            throw new Error("MetricEngineCollector initialization requires repository, handlers, logger, postProcessor, and templateValidator.");
        }
        this.repository = repository;
        this.handlers = handlers; // Strategy map
        this.logger = logger;
        this.postProcessor = postProcessor;
        this.templateValidator = templateValidator; // New dependency
    }

    /**
     * Handles the outcome of the template validation, determining if execution should proceed, skip, or fail.
     * @param {string} metricId - The ID of the metric being processed.
     * @param {object} validationResult - The result from templateValidator.execute.
     * @returns {object|null} A structured response if processing should stop (SKIPPED or FAILURE), otherwise null to proceed.
     * @private
     */
    _handleValidationResult(metricId, validationResult) {
        if (validationResult.valid) {
            return null; // Proceed
        }

        this.logger.warn(`Metric ID ${metricId} validation failure: ${validationResult.reason}.`);
        
        // Handle SKIPPED status (e.g., InactiveStatus)
        if (validationResult.reason === 'InactiveStatus') {
            return { metricId, status: 'SKIPPED', timestamp: Date.now(), value: null };
        }
        
        // Handle definite failures (TemplateNotFound, HandlerNotConfigured, etc.)
        return this.postProcessor.createFailureResponse(metricId, validationResult.reason);
    }

    /**
     * Collects and calculates a specific metric based on its configuration template.
     * @param {string} metricId - The ID of the metric to collect.
     * @returns {Promise<object>}
The calculated and standardized metric result (or structured failure status).
     */
    async collectMetric(metricId) {
        
        // Step 1: Validate metric template and handler using the dedicated tool
        const validationResult = this.templateValidator.execute({
            metricId: metricId,
            repository: this.repository,
            handlers: this.handlers
        });

        // Handle validation outcome (Success, Skip, or Failure)
        const earlyResponse = this._handleValidationResult(metricId, validationResult);
        if (earlyResponse) {
            return earlyResponse;
        }

        const { template, handler } = validationResult;
        const method = template.calculation_method;

        try {
            this.logger.info(`Executing metric ${metricId} via method: ${method}`);
            
            // Step 2: Execute the strategy handler
            const rawResult = await handler.execute(template);
            
            // Step 3: Delegate to PostProcessor for validation, transformation, and threshold checking
            return this.postProcessor.process(template, rawResult);
            
        } catch (error) {
            this.logger.error(`Failure collecting metric ${metricId} (Method: ${method}):`, error instanceof Error ? error.stack : String(error));
            
            // Step 4: Use postProcessor to standardize internal execution failures
            return this.postProcessor.createFailureResponse(
                metricId, 
                'ExecutionError', 
                error instanceof Error ? error.message : 'Unknown execution error'
            );
        }
    }
}

module.exports = MetricEngineCollector;