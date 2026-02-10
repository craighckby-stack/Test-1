// lib/ServicePolicyEngine.ts

interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'EXPONENTIAL' | 'LINEAR';
}

interface ServiceConfig {
  defaultTimeoutMs: number;
  retryPolicy: RetryPolicy;
}

// Interface reflecting the methods provided by the vanilla JS plugin instance
interface IRetryCalculator {
    calculateRetryDelay(attempt: number, initialDelayMs?: number): number;
    shouldRetry(attempt: number): boolean;
}

// Mock declaration for the injected plugin utility for type safety
declare const RetryBackoffCalculatorTool: {
    create(config: RetryPolicy, initialDelayMs?: number): IRetryCalculator;
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
    // We pass 200ms as the default initial delay, matching the original function signature default.
    if (typeof RetryBackoffCalculatorTool !== 'undefined' && RetryBackoffCalculatorTool.create) {
        this.retryCalculator = RetryBackoffCalculatorTool.create(this.config.retryPolicy, 200);
    } else {
        // Fallback/Mock initialization required for Type safety in environments where the tool isn't injected.
        // In the AGI-KERNEL, the primary path utilizes the tool.
        console.warn("RetryBackoffCalculatorTool not found, using internal mock.");
        this.retryCalculator = {
             calculateRetryDelay: (attempt: number, initialDelayMs: number = 200): number => {
                const policy = this.config.retryPolicy;
                if (attempt <= 0 || attempt > policy.maxRetries) return 0;
                
                const delay = initialDelayMs;
                const MAX_DELAY_MS = 30000;
                
                switch (policy.backoffStrategy) {
                    case 'EXPONENTIAL':
                        return Math.min(delay * Math.pow(2, attempt), MAX_DELAY_MS);
                    case 'LINEAR':
                        return delay * attempt;
                    default:
                        return delay;
                }
             },
             shouldRetry: (attempt: number): boolean => attempt <= this.config.retryPolicy.maxRetries
        };
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