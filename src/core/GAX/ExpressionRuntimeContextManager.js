/**
 * GAX Expression Runtime Context Manager (V94.3)
 * Manages execution resource consumption and memoization by utilizing external utilities.
 * Depends on ExecutionThrottler and CapacityLimitedCacheUtility.
 */
class ExpressionRuntimeContextManager {
  constructor(config) {
    this.limits = config.EngineLimits;
    
    // Runtime dependency checks
    if (typeof ExecutionThrottler === 'undefined') {
        throw new Error("Dependency Error: ExecutionThrottler plugin not available.");
    }
    if (typeof CapacityLimitedCacheUtility === 'undefined' || !CapacityLimitedCacheUtility.create) {
        throw new Error("Dependency Error: CapacityLimitedCacheUtility plugin not available.");
    }

    // Resource Throttling delegated to plugin
    this.throttler = new ExecutionThrottler(this.limits);

    // Memoization cache initialization
    this.memoCacheManager = CapacityLimitedCacheUtility.create(this.limits.memoizationLimit);
  }

  checkResourceLimits() {
    // Delegates all limit checks (complexity, depth, timeout) to the throttler
    this.throttler.check();
  }

  increaseComplexity(scoreIncrement) {
    this.throttler.increaseComplexity(scoreIncrement);
  }

  enterFunction() {
    // Function entry handles depth increment and immediate resource check
    this.throttler.enterScope();
  }

  exitFunction() {
    this.throttler.exitScope();
  }

  // Method for safe lookup/storage with memoization limit enforcement
  memoize(key, computation) {
    return CapacityLimitedCacheUtility.memoize(this.memoCacheManager, key, computation);
  }
}

module.exports = ExpressionRuntimeContextManager;