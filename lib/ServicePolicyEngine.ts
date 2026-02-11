// lib/ServicePolicyEngine.ts

interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'EXPONENTIAL' | 'LINEAR';
}

interface ServiceConfig {
  defaultTimeoutMs: number;
  retryPolicy: RetryPolicy;
}

// Interface reflecting the methods provided by the plugin instance
interface IRetryCalculator {
    calculateRetryDelay(attempt: number, initialDelayMs?: number): number;
    shouldRetry(attempt: number): boolean;
}

// Mock declaration for the injected plugin utility for type safety
declare const RetryBackoffCalculatorTool: {
    create(config: RetryPolicy, initialDelayMs?: number): IRetryCalculator;
};

// Minimal stub implementation when the actual tool is not injected (e.g., during tests)
const NoOpRetryCalculator: IRetryCalculator = {
    calculateRetryDelay: () => 0,
    shouldRetry: () => false
};

/**
 * Manages and calculates delays and timeouts based on GRS ServiceConfiguration.
 * Required for implementing resilient network operations within the AGI mesh.
 */
export class ServicePolicyEngine {
  private config: ServiceConfig;
  private retryCalculator: IRetryCalculator;

  constructor(config: ServiceConfig) {
    this.config = config;
    
    // CRITICAL: Initialize the retry logic using the extracted plugin.
    // We pass 200ms as the default initial delay.
    if (typeof RetryBackoffCalculatorTool !== 'undefined' && RetryBackoffCalculatorTool.create) {
        this.retryCalculator = RetryBackoffCalculatorTool.create(this.config.retryPolicy, 200);
    } else {
        // Fallback/Mock initialization required for Type safety. Logic is moved to the plugin.
        console.warn("RetryBackoffCalculatorTool not found, using NoOp stub.");
        this.retryCalculator = NoOpRetryCalculator;
    }
  }

  public getDefaultTimeout(): number {
    return this.config.defaultTimeoutMs;
  }

  /**
   * Calculates the delay (in milliseconds) before the next retry attempt.
   * Delegates calculation to the dedicated RetryBackoffCalculator utility.
   * @param attempt Current attempt number (1-indexed).
   * @param initialDelayMs Initial delay override (optional).
   */
  public calculateRetryDelay(attempt: number, initialDelayMs?: number): number {
    return this.retryCalculator.calculateRetryDelay(attempt, initialDelayMs);
  }

  public shouldRetry(attempt: number): boolean {
    return this.retryCalculator.shouldRetry(attempt);
  }
}