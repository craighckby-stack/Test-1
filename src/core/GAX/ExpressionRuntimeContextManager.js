/**
 * GAX Expression Runtime Context Manager (V94.2)
 * Manages execution resource consumption and ensures adherence to GAX_Expr_Core_v2 EngineLimits.
 * Now utilizes CapacityLimitedCacheUtility for memoization management.
 */
class ExpressionRuntimeContextManager {
  constructor(config) {
    this.limits = config.EngineLimits;
    this.complexity = 0;
    this.depth = 0;
    this.startTime = Date.now();
    
    // Runtime cache managed by the extracted utility
    // Assumes CapacityLimitedCacheUtility is globally available or required.
    if (typeof CapacityLimitedCacheUtility === 'undefined' || !CapacityLimitedCacheUtility.create) {
        throw new Error("Dependency Injection Error: CapacityLimitedCacheUtility plugin not available.");
    }
    this.memoCacheManager = CapacityLimitedCacheUtility.create(this.limits.memoizationLimit);
  }

  checkResourceLimits(nodeType) {
    if (this.complexity > this.limits.maxComplexityScore) {
      throw new Error("GAX_EVAL_ERROR: Complexity limit exceeded.");
    }
    if (this.depth > this.limits.maxExecutionDepth) {
      throw new Error("GAX_EVAL_ERROR: Maximum execution depth exceeded.");
    }
    if (Date.now() - this.startTime > this.limits.timeoutMs) {
      throw new Error("GAX_EVAL_ERROR: Execution timeout exceeded.");
    }
  }

  increaseComplexity(scoreIncrement) {
    this.complexity += scoreIncrement;
  }

  enterFunction() {
    this.depth++;
    this.checkResourceLimits('DEPTH_CHECK');
  }

  exitFunction() {
    this.depth--;
  }

  // Method for safe lookup/storage with memoization limit enforcement
  memoize(key, computation) {
    // Delegate the entire memoization logic (lookup, computation, set, eviction) to the utility.
    return CapacityLimitedCacheUtility.memoize(this.memoCacheManager, key, computation);
  }
}

module.exports = ExpressionRuntimeContextManager;