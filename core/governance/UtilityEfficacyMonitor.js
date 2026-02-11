// core/governance/UtilityEfficacyMonitor.js

/**
 * Interface for the MetricThresholdComparator plugin (Pre-existing dependency)
 * @interface MetricThresholdComparator
 */
interface MetricThresholdComparator {
    /**
     * Evaluates if a violation has occurred based on metric specification and current value.
     */
    evaluateViolation(metricSpec: { comparator: string, threshold: number }, currentValue: number): boolean;
}

/**
 * Interface for the CompliancePolicyExecutor plugin (New dependency)
 * @interface CompliancePolicyExecutor
 */
interface CompliancePolicyExecutor {
    /**
     * Triggers the policy execution for a detected violation (e.g., logging, alerting, policy engine call).
     */
    escalateViolation(utilityId: string, metricName: string, policyId: string, currentValue: number): Promise<void>;
    
    /**
     * Initiates a state transition or switchover to a target utility.
     */
    initiateFailover(targetUtilityId: string): Promise<void>;
}

// Define configuration shape (simplified)
interface MetricSpec {
    name: string;
    comparator: string; // e.g., 'LESS_THAN'
    threshold: number;
    failure_policy_id?: string;
}

interface UtilitySpec {
    metrics: MetricSpec[];
    failover?: {
        enabled: boolean;
        target_utility_id: string;
    };
}

interface Config {
    default_policy_id: string;
    operational_domains: {
        [domain: string]: {
            utilities: {
                [utilityId: string]: UtilitySpec;
            };
        };
    };
}


// UtilityEfficacyMonitor Class Definition
class UtilityEfficacyMonitor {
  // Utilize robust private class fields for encapsulation
  #config: Config;
  #runtimeMetrics: Record<string, any>;
  #thresholdComparator: MetricThresholdComparator;
  #policyExecutor: CompliancePolicyExecutor;

  /**
   * @param config The governance configuration object (passed directly, not loaded from path).
   * @param thresholdComparator Injected dependency for metric comparison logic.
   * @param policyExecutor Injected dependency for compliance action execution.
   */
  constructor(
    config: Config,
    thresholdComparator: MetricThresholdComparator,
    policyExecutor: CompliancePolicyExecutor
  ) {
    // 1. Dependency Injection and Strict Encapsulation
    this.#thresholdComparator = thresholdComparator;
    this.#policyExecutor = policyExecutor;
    
    // 2. Enforce Immutability: Deep-freeze the governance configuration to prevent runtime modification.
    // NOTE: Reliance on Object.freeze guarantees top-level immutability; a deep freeze utility
    // is recommended for production systems with complex nested configurations.
    this.#config = Object.freeze(config);
    
    this.#runtimeMetrics = {}; // Data store for live operational metrics (mutable internal state)
    
    console.log(`Efficacy Monitor initialized.`);
  }

  /**
   * Checks a specific utility against its operational metrics specifications.
   */
  async checkUtilityCompliance(domain: string, utilityId: string, currentMetrics: Record<string, number>): Promise<void> {
    const domainConfig = this.#config.operational_domains[domain];
    if (!domainConfig) {
        console.warn(`Domain ${domain} not configured.`);
        return;
    }
    
    const utilitySpec = domainConfig.utilities[utilityId];
    if (!utilitySpec) {
        console.warn(`Utility ${utilityId} not found in domain ${domain}.`);
        return;
    }

    for (const metricSpec of utilitySpec.metrics) {
      const currentValue = currentMetrics[metricSpec.name];
      
      // Use the reusable plugin logic for violation detection
      const violation = this.#thresholdComparator.evaluateViolation(metricSpec, currentValue);

      if (violation) {
        const policyId = metricSpec.failure_policy_id || this.#config.default_policy_id;
        
        // Delegation 1: Escalate violation using the executor plugin
        await this.#policyExecutor.escalateViolation(utilityId, metricSpec.name, policyId, currentValue);
        
        if (utilitySpec.failover && utilitySpec.failover.enabled) {
          // Delegation 2: Initiate failover using the executor plugin
          await this.#policyExecutor.initiateFailover(utilitySpec.failover.target_utility_id);
        }
      }
    }
  }
}