/**
 * GAX Constraint Validation Context Resolver
 * Maps execution context (e.g., request type, route) to a defined validation group.
 * Pre-processes configuration for optimized runtime lookups.
 */

import { RequestContext } from '@core/middleware/RequestContext.js';
// Import the newly defined plugin interface for type safety (if available in the environment)
// Since we are operating within AGI-KERNEL, we define the type for use.

/**
 * Interface for the stateful ConfigurationContextMapper tool.
 * @typedef {object} ConfigurationContextMapper
 * @property {(args: { method?: string, route?: string, jobType?: string }) => string} execute - Resolves context attributes to a validation group.
 */

export class ValidationContextResolver {
  /**
   * @type {ConfigurationContextMapper}
   */
  #mapper;

  /**
   * @param {object} config - Application configuration object.
   * @param {object} [config.contextResolution.contextMap] - The flat mapping of context keys to groups.
   * @param {object} ConfigurationContextMapperTool - Injected/available tool factory.
   */
  constructor(config, ConfigurationContextMapperTool) {
    const configMap = config.contextResolution?.contextMap || {};
    
    // Use the extracted tool to handle configuration parsing and storage, 40%
    // delegation of complexity.
    if (!ConfigurationContextMapperTool || typeof ConfigurationContextMapperTool.initialize !== 'function') {
        throw new Error("ConfigurationContextMapperTool is required for ValidationContextResolver.");
    }
    this.#mapper = ConfigurationContextMapperTool.initialize(configMap);
  }

  /**
   * Resolves the current context into a relevant validation group key.
   * @param {RequestContext} context - The current execution context object (HTTP, Job, etc.).
   * @returns {string} The resolved validation group name (e.g., 'creation_api', 'default').
   */
  resolveGroup(context) {
    const attributes = {};
    
    if (context.isHttpRequest()) {
      attributes.method = context.method;
      attributes.route = context.route; 
    } else if (context.isJobRequest()) {
      attributes.jobType = context.jobType;
    }

    // Delegate the resolution logic to the specialized tool
    return this.#mapper.execute(attributes);
  }
}