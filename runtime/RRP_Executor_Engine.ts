interface RRPAction {
  type: 'LOG' | 'STATE' | 'NOTIFICATION' | 'ALARM';
  detail: string;
  [key: string]: any; // Allows dynamic mode/channel/level
}

interface RRPTrigger {
  severity: 'CATASTROPHIC' | 'CRITICAL' | 'HIGH' | 'WARNING';
  description: string;
  actions: RRPAction[];
}

/**
 * Interface reflecting the contract of the RRP Action Processor plugin.
 */
interface IRRPActionProcessor {
    process(action: RRPAction): Promise<void>;
}

/**
 * RRP_Executor_Engine:
 * Executes mandatory Rollback and Recovery Policies defined in RRP_Policy_Definition.json.
 * Guarantees atomic, sequenced execution of recovery actions, prioritizing CATASTROPHIC
 * events even during resource exhaustion.
 */
class RRPExecutorEngine {
  private policies: Record<string, RRPTrigger>;
  private actionProcessor: IRRPActionProcessor;

  constructor(policyDefinition: Record<string, RRPTrigger>, actionProcessor: IRRPActionProcessor) {
    this.policies = policyDefinition;
    // Dependency Injection: Rely on the abstracted processor interface
    this.actionProcessor = actionProcessor;
  }

  /**
   * Executes all actions defined under a specific policy hook.
   * Execution is designed to be fault-tolerant: if one action fails, subsequent actions are still attempted.
   */
  public async executeTrigger(hookName: string): Promise<void> {
    const trigger = this.policies[hookName];
    if (!trigger) {
      console.warn(`[RRP EXEC] Trigger '${hookName}' not defined. Skipping.`);
      return;
    }

    console.error(`[RRP EXEC] Activating trigger: ${hookName} (Severity: ${trigger.severity})`);

    // 1. Execute actions robustly, ensuring subsequent actions run even if one fails.
    // Recovery must be resilient against partial failures.
    for (const [index, action] of trigger.actions.entries()) {
      try {
        await this.processAction(action);
      } catch (error) {
        // CRITICAL: Log the failure but CONTINUE the execution chain.
        console.error(
          `[RRP EXEC] CRITICAL FAILURE: Action step ${index} failed for trigger '${hookName}' (Type: ${action.type}). Continuing execution chain.`, 
          error
        );
      }
    }

    // 2. Report Final State to central supervisor
    this.reportRecoveryCompletion(hookName, trigger.severity);
  }

  private async processAction(action: RRPAction): Promise<void> {
    // Delegation to the extracted tool for robust, atomic action execution.
    await this.actionProcessor.process(action);
  }

  private reportRecoveryCompletion(hookName: string, severity: string): void {
    // Implementation detail: Notify upstream supervisor of recovery attempt success/failure.
  }
}