/**
 * GAX Constraint Validation Context Resolver
 * Maps execution context (e.g., request type, route) to a defined validation group.
 */

import { RequestContext } from '@core/middleware/RequestContext.js';

export class ValidationContextResolver {
  constructor(config) {
    this.contextMap = config.contextResolution.contextMap;
  }

  /**
   * Resolves the current context into a relevant validation group key.
   * @param {RequestContext} context - The current execution context object (HTTP, Job, etc.).
   * @returns {string} The resolved validation group name (e.g., 'creation_api', 'default').
   */
  resolveGroup(context) {
    if (context.isHttpRequest()) {
      const key = `${context.method}:${context.route}`; 
      
      // Basic route glob matching (can be expanded to regex)
      for (const pattern in this.contextMap) {
        if (pattern.startsWith('HTTP') && this.matchesPattern(key, pattern.substring(5))) {
          return this.contextMap[pattern];
        }
      }
    } else if (context.isJobRequest()) {
       const key = `JOB_TYPE:${context.jobType}`;
       if (this.contextMap[key]) {
         return this.contextMap[key];
       }
    }

    // Default to the highest priority group or 'default'
    return 'default';
  }
  
  // Simple utility for pattern matching against paths
  matchesPattern(target, pattern) {
      if (pattern.endsWith('/*')) {
          return target.startsWith(pattern.slice(0, -2));
      }
      return target === pattern;
  }
}