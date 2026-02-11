/**
 * GAX Constraint Validation Context Resolver
 * Maps execution context (e.g., request type, route) to a defined validation group.
 * Pre-processes configuration for optimized runtime lookups.
 */

import { RequestContext } from '@core/middleware/RequestContext.js';

/**
 * Interface for the stateful ContextResolutionMapper tool.
 * @typedef {object} ContextResolutionMapperInstance
 * @property {(args: { method?: string, route?: string, jobType?: string }) => string} execute - Resolves context attributes to a validation group.
 */

export class ValidationContextResolver {
  /**
   * @type {ContextResolutionMapperInstance}
   */
  #mapper;

  /**
   * @param {object} config - Application configuration object.
   * @param {object} [config.contextResolution.contextMap] - The flat mapping of context keys to groups.
   * @param {object} ContextResolutionMapper - Injected tool class that exposes a static initialize() method.
   * 
   * Note: ConfigurationContextMapperTool has been replaced by the abstracted ContextResolutionMapper.
   */
  constructor(config, ContextResolutionMapper) {
    const configMap = config.contextResolution?.contextMap || {};
    
    // Ensure the required plugin is available for initialization.
    if (!ContextResolutionMapper || typeof ContextResolutionMapper.initialize !== 'function') {
        throw new Error("ContextResolutionMapper is required for ValidationContextResolver.");
    }
    
    // Delegate configuration parsing and context structure creation to the specialized tool.
    this.#mapper = ContextResolutionMapper.initialize(configMap);
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