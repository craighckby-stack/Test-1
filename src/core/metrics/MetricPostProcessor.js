/**
 * @file src/core/metrics/MetricPostProcessor.js
 * 
 * MetricPostProcessor manages a recursive pipeline of transformation steps.
 * By relying entirely on the IMetricProcessingStep plugin interface, 
 * the core logic remains minimal, highly efficient, and easily extensible.
 */

/**
 * @typedef {import('../../plugins/IMetricProcessingStep')} IMetricProcessingStep
 */

class MetricPostProcessor {
    
    /**
     * Initializes the processor with a fixed sequence of steps (the pipeline).
     * 
     * @param {IMetricProcessingStep[]} steps - An array of objects implementing IMetricProcessingStep.
     */
    constructor(steps = []) {
        if (!Array.isArray(steps)) {
            throw new TypeError("Steps must be an array of IMetricProcessingStep implementations.");
        }
        // Store steps as a frozen array for runtime immutability
        this.processingSteps = Object.freeze(steps);
    }

    /**
     * Executes the processing pipeline. It applies transformations sequentially
     * using array reduction, ensuring recursive application of logic.
     * 
     * @param {Object[]} rawMetrics - Array of raw metric objects.
     * @returns {Object[]} Processed metrics, or an empty array if input is invalid.
     */
    process(rawMetrics) {
        if (!Array.isArray(rawMetrics)) {
            console.warn("Input to MetricPostProcessor is not an array. Returning empty array.");
            return [];
        }

        // The core recursive abstraction: functional reduction over the pipeline steps
        return this.processingSteps.reduce((currentMetrics, step, index) => {
            
            if (typeof step.transform !== 'function') {
                console.error(`Pipeline step ${index} is missing the required 'transform' method. Skipping.`);
                return currentMetrics; // Skip the invalid step
            }

            try {
                // Apply the transformation and obtain the new state
                const transformedMetrics = step.transform(currentMetrics);

                if (!Array.isArray(transformedMetrics)) {
                    console.error(`Step ${index} (Type: ${step.constructor.name}) returned non-array output. Aborting pipeline.`);
                    // Return the last valid array if the contract is violated
                    return currentMetrics; 
                }
                
                return transformedMetrics;
            } catch (error) {
                console.error(`Error executing pipeline step ${index} (${step.constructor.name}):`, error.message);
                return currentMetrics; // Return previous state on error
            }
            
        }, rawMetrics);
    }
    
    /**
     * Creates a new MetricPostProcessor instance with additional steps appended.
     * This supports functional chaining and immutability.
     * 
     * @param {...IMetricProcessingStep} newSteps - New steps to add to the pipeline.
     * @returns {MetricPostProcessor} A new instance.
     */
    extend(...newSteps) {
        return new MetricPostProcessor([...this.processingSteps, ...newSteps]);
    }
}

module.exports = MetricPostProcessor;